import express from 'express'
import HttpStatus from 'http-status-codes'
import mongoose from 'mongoose'

import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR } from '../constants'
import { Feedback, Project } from '../models'
import { FeedbackSchema } from '../schemas'
import { logger, isAdmin, getSchemaError } from '../utils'

const routes = () => {
  const router = express.Router()
  router.post('/', async (req, res) => {
    FeedbackSchema.validateAsync(req.body)
      .then(async (feedback) => {
        const userId = req.user.id
        const { projectId } = feedback
        try {
          const project = await Project.findById(projectId)

          if (!project) {
            logger.error(`Project ${projectId} was not found`)
            res.status(HttpStatus.BAD_REQUEST).json({
              message: `${BAD_REQUEST}: project is not found`,
            })
          } else {
            if (!isAdmin(req.user)) {
              if (
                !project.manager &&
                !project.associates.includes(mongoose.Types.ObjectId(userId))
              ) {
                res.status(HttpStatus.FORBIDDEN).json({
                  message: FORBIDDEN,
                })
              } else if (
                project.manager.toString() !== userId &&
                !project.associates.includes(mongoose.Types.ObjectId(userId))
              ) {
                res.status(HttpStatus.FORBIDDEN).json({
                  message: FORBIDDEN,
                })
              }
            }

            const newFeedback = await Feedback.create({
              userId,
              ...feedback,
            })

            res.status(HttpStatus.OK).send(newFeedback)
          }
        } catch (error) {
          logger.error(error)
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
  })

  // TODO: permission
  // get latest feedback
  router.get('/', async (req, res) => {
    const userId = req.user.id
    const { projectId } = req.query

    try {
      if (!projectId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          message: `${BAD_REQUEST}: projectId is required`,
        })
      } else {
        const feedback = await Feedback.findOne(
          { projectId, userId },
          {},
          {
            sort: { createdAt: -1 },
          },
        )
        if (!feedback) {
          res.status(HttpStatus.OK).send({
            message: `Not found Feedback with surveyId projectId ${projectId} and userId ${userId}`,
          })
        } else {
          res.status(HttpStatus.OK).send(feedback)
        }
      }
    } catch (err) {
      logger.error(err)
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: INTERNAL_SERVER_ERROR })
    }
  })

  // TODO: permission
  // get feedback history
  router.get('/history', async (req, res) => {
    const userId = req.user.id
    const { projectId, surveyId } = req.query

    try {
      const feedbacks = await Feedback.find(
        { surveyId, projectId, userId },
        {},
        {
          sort: { createdAt: -1 },
        },
      )

      res.status(HttpStatus.OK).send(feedbacks)
    } catch (err) {
      logger.error(err)
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: INTERNAL_SERVER_ERROR })
    }
  })

  return router
}

export default routes
