import express from 'express'
import HttpStatus from 'http-status-codes'

import { FORBIDDEN, INTERNAL_SERVER_ERROR } from '../constants'
import { Survey } from '../models'
import { SurveySchema } from '../schemas'
import { logger, isAdmin, isSupervisor, getSchemaError } from '../utils'

const routes = () => {
  const router = express.Router()
  router.get('/', async (req, res) => {
    try {
      if (isAdmin(req.user) || isSupervisor(req.user)) {
        const surveys = await Survey.find({})
        res.status(HttpStatus.OK).send(surveys)
      } else {
        res.status(HttpStatus.FORBIDDEN).json({
          message: FORBIDDEN,
        })
      }
    } catch (e) {
      logger.error(e)
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: INTERNAL_SERVER_ERROR,
      })
    }
  })

  router.get('/:id', async (req, res) => {
    const { id } = req.params
    try {
      // TODO: get survey based on project
      const survey = await Survey.findOne({ _id: id })
      res.status(HttpStatus.OK).send(survey)
    } catch (e) {
      logger.error(e)
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `${INTERNAL_SERVER_ERROR} with survey ${id}`,
      })
    }
  })

  router.post('/', async (req, res) => {
    if (isAdmin(req.user)) {
      SurveySchema.validateAsync(req.body)
        .then(async (survey) => {
          try {
            const createdSurvey = await Survey.create(survey)
            if (createdSurvey) {
              res.status(HttpStatus.OK).send(createdSurvey)
            } else {
              logger.error(createdSurvey)
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
        .catch((e) => {
          logger.error(e)
          res.status(HttpStatus.BAD_REQUEST).json({
            message: getSchemaError(e),
          })
        })
    } else {
      res.status(HttpStatus.FORBIDDEN).json({
        message: FORBIDDEN,
      })
    }
  })

  router.patch('/:id', async (req, res) => {
    if (isAdmin(req.user)) {
      const { id } = req.params
      SurveySchema
        .validateAsync(req.body)
        .then(async (survey) => {
          try {
            const update = await Survey.findByIdAndUpdate(id, survey, {
              useFindAndModify: false,
              runValidators: true,
            })
            if (!update) {
              res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: INTERNAL_SERVER_ERROR,
              })
            } else {
              res.status(HttpStatus.OK).send(update)
            }
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
            message: getSchemaError(e),
          })
        })
    } else {
      res.status(HttpStatus.FORBIDDEN).json({
        message: FORBIDDEN,
      })
    }
  })

  // TODO: DELETE survey later
  // router.delete('/:id', async (req, res) => {
  //   if (isAdmin(req.user)) {
  //     const { id } = req.params
  //     try {
  //       const data = await Survey.deleteOne(id, { useFindAndModify: false })
  //       if (!data) {
  //         res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
  //           message: INTERNAL_SERVER_ERROR,
  //         })
  //       } else {
  //         res.status(HttpStatus.OK).send({ message: 'Survey was deleted successfully.' })
  //       }
  //     } catch (err) {
  //       logger.error(err)
  //       res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
  //         message: INTERNAL_SERVER_ERROR,
  //       })
  //     }
  //   } else {
  //     res.status(HttpStatus.FORBIDDEN).json({
  //       message: FORBIDDEN,
  //     })
  //   }
  // })

  return router
}

export default routes
