import bcrypt from 'bcryptjs'
import express from 'express'
import HttpStatus from 'http-status-codes'

import { BCRYPT_SALT, ROLE_SUPER_ADMIN } from '../config'
import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR, USER_DUPLICATED } from '../constants'
import { User } from '../models'
import { createUserSchema, updatePasswordSchema, updateUserSchema } from '../schemas'
import { logger, isAdmin, getSchemaError } from '../utils'

const routes = () => {
  const router = express.Router()
  router.post('/', async (req, res) => {
    if (isAdmin(req.user)) {
      createUserSchema
        .validateAsync(req.body)
        .then(async (user) => {
          try {
            const userCreated = await User.create({
              ...user,
              password: bcrypt.hashSync(user.password, BCRYPT_SALT),
              roles: [...new Set(req.body.roles)],
            })
            logger.info(`User ${userCreated.id} is created by ${req.user.id}`)
            res.status(HttpStatus.OK).send(userCreated.toJSON())
          } catch (err) {
            logger.error(err)
            // username is existed most of the time
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              message: USER_DUPLICATED,
            })
          }
        })
        .catch((e) => {
          logger.error(e)
          res.status(HttpStatus.BAD_REQUEST).json({
            message: getSchemaError(e),
          })
        })
    } else {
      logger.error(`User ${req.user.id} tried to create new user`)
      res.status(HttpStatus.FORBIDDEN).json({
        message: FORBIDDEN,
      })
    }
  })

  router.get('/', async (req, res) => {
    if (isAdmin(req.user)) {
      try {
        const users = await User.find({})
        logger.info(`User ${req.user.id} get all users`)
        res.status(HttpStatus.OK).send(users.map((user) => user.toJSON()))
      } catch (e) {
        logger.error(e)
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: INTERNAL_SERVER_ERROR,
        })
      }
    } else {
      logger.error(`User ${req.user.id} tried to get all users`)
      res.status(HttpStatus.FORBIDDEN).json({
        message: FORBIDDEN,
      })
    }
  })

  router.delete('/:id', async (req, res) => {
    const { id } = req.params
    if (isAdmin(req.user)) {
      try {
        const user = await User.findById(id)
        // DO NOT DELETE the root user
        if (user.roles.includes(ROLE_SUPER_ADMIN)) {
          logger.info(`User ${req.user.id} tried to delete root user`)
          res.status(HttpStatus.FORBIDDEN).json({
            message: FORBIDDEN,
          })
        } else {
          const deletedUser = await User.findByIdAndUpdate(
            id,
            { isDeleted: true },
            {
              useFindAndModify: false,
              runValidators: true,
            },
          )
          if (deletedUser) {
            logger.info(`User ${req.user.id} deleted user ${id}`)
            res.status(HttpStatus.OK).send(deletedUser.toJSON())
          } else {
            logger.error(deletedUser)
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              message: INTERNAL_SERVER_ERROR,
            })
          }
        }
      } catch (e) {
        logger.error(e)
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: INTERNAL_SERVER_ERROR,
        })
      }
    } else {
      logger.error(`User ${req.user.id} tried to delete user ${id}`)
      res.status(HttpStatus.FORBIDDEN).json({
        message: FORBIDDEN,
      })
    }
  })

  router.patch('/:id', async (req, res) => {
    const { id } = req.params

    if (isAdmin(req.user) || id === req.user.id) {
      updateUserSchema
        .validateAsync(req.body)
        .then(async (user) => {
          try {
            let { roles } = user
            const rootUser = await User.findById(id)
            if (rootUser.roles.includes(ROLE_SUPER_ADMIN)) {
              roles = roles.concat(ROLE_SUPER_ADMIN)
            }

            if (roles && roles.length > 0) {
              // eslint-disable-next-line
              user.roles = [...new Set(roles)]
            }
            const usr = await User.findByIdAndUpdate(
              id,
              { ...user },
              {
                useFindAndModify: false,
                runValidators: true,
              },
            )
            if (usr) {
              logger.info(`User ${id} is updated by ${req.user.id}`)
              res.status(HttpStatus.OK).send(usr.toJSON())
            } else {
              logger.error(usr)
              res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: INTERNAL_SERVER_ERROR,
              })
            }
          } catch (err) {
            logger.error(err)
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
    } else {
      res.status(HttpStatus.FORBIDDEN).json({
        message: FORBIDDEN,
      })
    }
  })

  // change password by admin
  router.put('/:id', async (req, res) => {
    const { id } = req.params
    // temporary let admin and user change password
    if (isAdmin(req.user) || id === req.user.id) {
      updatePasswordSchema
        .validateAsync(req.body)
        .then(async ({ newPassword, confirmNewPassword }) => {
          if (newPassword !== confirmNewPassword) {
            res.status(HttpStatus.BAD_REQUEST).json({
              message: `${BAD_REQUEST}: password is not match`,
            })
          } else {
            try {
              const usr = await User.findByIdAndUpdate(id, {
                password: bcrypt.hashSync(newPassword, BCRYPT_SALT),
              })

              if (usr) {
                logger.info(`User ${id} is updated by ${req.user.id}`)
                res.status(HttpStatus.OK).send(usr.toJSON())
              } else {
                logger.error(usr)
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                  message: INTERNAL_SERVER_ERROR,
                })
              }
            } catch (e) {
              logger.error(e)
              res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: INTERNAL_SERVER_ERROR,
              })
            }
          }
        })
        .catch((error) => {
          logger.error(error)
          res.status(HttpStatus.BAD_REQUEST).json({
            message: getSchemaError(error),
          })
        })
    } else {
      res.status(HttpStatus.FORBIDDEN).json({
        message: FORBIDDEN,
      })
    }
  })

  return router
}

export default routes
