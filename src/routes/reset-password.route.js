import bcrypt from 'bcryptjs'
import express from 'express'
import HttpStatus from 'http-status-codes'
import moment from 'moment'
import nodemailer from 'nodemailer'
import randomKey from 'random-key'
import StringTemplate from 'string-template'

import { BCRYPT_SALT } from '../config'
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, MAIL_USER, MAIL_PASSWORD, INSTANTCE } from '../constants'
import { User } from '../models'
import { logger, getSchemaError } from '../utils'
import { resetPasswordSchema } from '../schemas'

const routes = () => {
  const router = express.Router()
  router.get('/:username', async (req, res) => {
    const { username } = req.params
    try {
      const user = await User.findOne({ username })
      if (user) {
        const key = randomKey.generate()
        const expiredAt = moment().add(2, 'hour').toISOString()
        await User.findByIdAndUpdate(
          user.id,
          {
            requestReset: [
              ...user.requestReset,
              {
                key,
                expiredAt,
              },
            ],
          },
          {
            useFindAndModify: false,
            runValidators: true,
          },
        )
        const transporter = nodemailer.createTransport({
          host: 'smtp.ifisolution.com',
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: MAIL_USER, // generated ethereal user
            pass: MAIL_PASSWORD, // generated ethereal password
          },
        })

        // send mail with defined transport object
        const htmlTemplate = StringTemplate(
          `
          <div>
          <div><span style="
             font-weight: bold;
             ">Hello {name},</span><br>You recently requested to reset your password for your account. Use the button below to reset it. <span style="
             font-weight: bold;
             ">This URL is only valid for the next 2 hours.</span></div>
          <div style="
             text-align: center;
             margin: 30px 0;
             ">
                <a
                target="_blank"
                href="{instance}/reset?username={username}&key={key}"
                style="
                color: white;
                background-color: #64b93a;
                border: none;
                font-weight: bold;
                border-radius: 5px;
                cursor: pointer;
                width: 175px;
                height: 35px;
                line-height: 32px;
                display: inline-block;
                border-radius: 5px;
                ">Reset your password</a>
             </div>
          <div>
             If you did not request a password reset, please ignore this email.<br><br>Thanks,<br>IFI Solution
             <div>
             </div>
          </div>
       </div>
        `,
          {
            instance: INSTANTCE,
            name: `${user.firstName} ${user.lastName}`,
            username,
            key,
          },
        )
        await transporter.sendMail({
          from: MAIL_USER, // sender address
          to: username, // list of receivers
          subject: 'IFI Solution Feedback: Reset Password', // Subject line
          html: htmlTemplate, // lower case username
        })
      }
    } catch (error) {
      logger.error(error)
    }
    res.status(HttpStatus.OK).send({})
  })

  router.patch('/', async (req, res) => {
    resetPasswordSchema
      .validateAsync(req.body)
      .then(async ({ newPassword, confirmNewPassword, key, username }) => {
        try {
          const user = await User.findOne({ username })
          if (user) {
            const requestReset = user.requestReset.find((ele) => ele.key === key)
            let expired = false
            if (requestReset) {
              if (moment(requestReset.expiredAt) < moment()) {
                expired = true
              }
            }
            if (requestReset && !expired) {
              if (newPassword !== confirmNewPassword) {
                res.status(HttpStatus.BAD_REQUEST).json({
                  message: `${BAD_REQUEST}: New password and confirm password are not match`,
                })
              } else {
                const usrUpdated = await User.findByIdAndUpdate(user.id, {
                  password: bcrypt.hashSync(newPassword, BCRYPT_SALT),
                })

                if (usrUpdated) {
                  res.status(HttpStatus.OK).send(usrUpdated.toJSON())
                } else {
                  logger.error(usrUpdated)
                  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                    message: INTERNAL_SERVER_ERROR,
                  })
                }
              }
            } else {
              res.status(HttpStatus.BAD_REQUEST).json({
                message: `${BAD_REQUEST}: Key is not match or expired key`,
              })
            }
          } else {
            res.status(HttpStatus.BAD_REQUEST).json({
              message: `${BAD_REQUEST}: Cannot find user`,
            })
          }
        } catch (error) {
          logger.error(error)
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: INTERNAL_SERVER_ERROR,
          })
        }
      })
      .catch((error) => {
        logger.error(error)
        res.status(HttpStatus.BAD_REQUEST).json({
          message: getSchemaError(error),
        })
      })
  })

  return router
}

export default routes
