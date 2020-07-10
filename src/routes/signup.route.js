import Joi from '@hapi/joi'
import bcrypt from 'bcryptjs'
import express from 'express'
import HttpStatus from 'http-status-codes'

import { BCRYPT_SALT } from '../config'
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from '../constants'
import { User } from '../models'
import { logger } from '../utils'

const schema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
})

const routes = () => {
  const router = express.Router()
  router.post('/', async (req, res) => {
    schema
      .validateAsync(req.body)
      .then(async (user) => {
        try {
          await User.create({
            username: user.username,
            email: user.username,
            password: bcrypt.hashSync(user.password, BCRYPT_SALT),
          })
          res.status(HttpStatus.OK).json({
            message: 'Sign up successful',
          })
        } catch (err) {
          logger.error(err)
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: INTERNAL_SERVER_ERROR,
          })
        }
      })
      .catch((e) => {
        logger.error(e)
        res.status(HttpStatus.BAD_REQUEST).json({
          message: BAD_REQUEST,
        })
      })
  })

  return router
}

export default routes
