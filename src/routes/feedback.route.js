import express from 'express'
import HttpStatus from 'http-status-codes'
import mongoose from 'mongoose'
import lodash from 'lodash'

import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR } from '../constants'
import { Feedback, Project } from '../models'
import { createFeedbackSchema, editFeedbackSchema } from '../schemas'
import { logger, isAdmin, isSupervisor, getSchemaError } from '../utils'

const routes = () => {
  const router = express.Router()
  router.post('/', async (req, res) => {
    createFeedbackSchema
      .validateAsync(req.body)
      .then(async (feedback) => {
        const userId = req.user.id
        const { projectId } = feedback
        try {
          const project = await Project.findById(projectId)
          if (isSupervisor(req.user) || project.views.includes(mongoose.Types.ObjectId(userId))) {
            res.status(HttpStatus.FORBIDDEN).json({
              message: FORBIDDEN,
            })
            return
          }

          if (!project) {
            logger.error(`Project ${projectId} was not found`)
            res.status(HttpStatus.BAD_REQUEST).json({
              message: `${BAD_REQUEST}: project is not found`,
            })
          } else {
            const matchOps = {}
            matchOps.projectId = projectId
            if (!isAdmin(req.user)) {
              if (project.associates.includes(mongoose.Types.ObjectId(userId))) {
                matchOps.userId = userId
              } else if (project.manager.toString() !== userId) {
                res.status(HttpStatus.FORBIDDEN).json({
                  message: FORBIDDEN,
                })
              }
            }

            const lastFeedback = {
              ...(
                await Feedback.findOne(
                  matchOps,
                  {},
                  {
                    sort: { createdAt: -1 },
                  },
                )
              ).toObject(),
            }

            const newFeedback = {
              ...(
                await Feedback.create({
                  userId,
                  ...feedback,
                })
              ).toObject(),
            }

            const answersChanged = []
            /*eslint no-param-reassign: ["error", { "props": false }]*/
            if (lastFeedback) {
                newFeedback.sections.forEach((newSection) => {
                newSection.questions.forEach((question) => {
                  question.newRating = question.rating
                })
              })
              lastFeedback.sections.forEach((oldSection) => {
                oldSection.questions.forEach((question) => {
                  question.oldRating = question.rating
                })
              })
              const mergeFeedback = lodash.merge(lastFeedback, newFeedback)
              mergeFeedback.sections.forEach((section) => {
                section.questions.forEach((question) => {
                  if (question.oldRating && question.newRating) {
                    let typeChanged = ''
                    if (question.oldRating < question.newRating) {
                      typeChanged = 'asc'
                    }
                    if (question.oldRating > question.newRating) {
                      typeChanged = 'des'
                    }
                    if (typeChanged) {
                      const answerChanged = {
                        question: question.text,
                        oldPoint: question.oldRating,
                        newPoint: question.newRating,
                        typeChanged,
                        comment: '',
                      }
                      answersChanged.push(answerChanged)
                    }
                  }
                })
              })
            }
            const response = { id: newFeedback._id, answersChanged }

            res.status(HttpStatus.OK).send(response)
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

  // edit feedback (comment answers)
  router.put('/', async (req, res) => {
    editFeedbackSchema
      .validateAsync(req.body)
      .then(async (feedback) => {
        const { feedbackId, sections } = feedback
        try {
          const update = await Feedback.findByIdAndUpdate(feedbackId, {
            sections,
          })
          if (!update) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              message: INTERNAL_SERVER_ERROR,
            })
          } else {
            res.status(HttpStatus.OK).send(update)
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
        const project = await Project.findById(projectId)
        if (
          !project.manager &&
          !project.associates.includes(mongoose.Types.ObjectId(userId)) &&
          !project.views.includes(mongoose.Types.ObjectId(userId)) &&
          !isAdmin(req.user) &&
          !isSupervisor(req.user)
        ) {
          res.status(HttpStatus.FORBIDDEN).json({
            message: FORBIDDEN,
          })
        } else if (
          project.manager.toString() !== userId &&
          !project.associates.includes(mongoose.Types.ObjectId(userId)) &&
          !project.views.includes(mongoose.Types.ObjectId(userId)) &&
          !isAdmin(req.user) &&
          !isSupervisor(req.user)
        ) {
          res.status(HttpStatus.FORBIDDEN).json({
            message: FORBIDDEN,
          })
        } else {
          const matchOps = {}
          matchOps.projectId = projectId
          if (
            !isAdmin(req.user) &&
            !isSupervisor(req.user) &&
            !project.views.includes(mongoose.Types.ObjectId(userId))
          ) {
            matchOps.userId = userId
          }
          const feedback = await Feedback.findOne(
            matchOps,
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
      }
    } catch (err) {
      logger.error(err)
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: INTERNAL_SERVER_ERROR })
    }
  })

  // get feedback history
  router.get('/history', async (req, res) => {
    const userId = req.user.id
    const { projectId } = req.query
    let feedbacks = []
    const matchOps = {}
    if (projectId) {
      matchOps.projectId = projectId
    }

    try {
      if (isAdmin(req.user) || isSupervisor(req.user)) {
        feedbacks = await Feedback.find(
          matchOps,
          {},
          {
            sort: { createdAt: -1 },
          },
        )
          .populate({ path: 'userId' })
          .populate({ path: 'projectId' })

        res.status(HttpStatus.OK).send(
          feedbacks.map((feedback) => ({
            id: feedback.id,
            review: feedback.review,
            event: feedback.event,
            sections: feedback.sections,
            createdAt: feedback.createdAt,
            user: {
              firstName: feedback.userId.firstName,
              lastName: feedback.userId.lastName,
            },
            project: {
              name: feedback.projectId.name,
            },
          })),
        )
        return
      }

      if (!projectId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          message: `${BAD_REQUEST}: projectId is required`,
        })
      } else {
        const project = await Project.findById(projectId)
        if (!project.views.includes(mongoose.Types.ObjectId(userId))) {
          matchOps.userId = userId
        }
        if (
          !project.manager &&
          !project.associates.includes(mongoose.Types.ObjectId(userId)) &&
          !project.views.includes(mongoose.Types.ObjectId(userId))
        ) {
          res.status(HttpStatus.FORBIDDEN).json({
            message: FORBIDDEN,
          })
        } else if (
          project.manager.toString() !== userId &&
          !project.associates.includes(mongoose.Types.ObjectId(userId)) &&
          !project.views.includes(mongoose.Types.ObjectId(userId))
        ) {
          res.status(HttpStatus.FORBIDDEN).json({
            message: FORBIDDEN,
          })
        } else {
          feedbacks = await Feedback.find(
            matchOps,
            {},
            {
              sort: { createdAt: -1 },
            },
          )
            .populate({ path: 'userId' })
            .populate({ path: 'projectId' })

          res.status(HttpStatus.OK).send(
            feedbacks.map((feedback) => ({
              id: feedback.id,
              review: feedback.review,
              event: feedback.event,
              sections: feedback.sections,
              createdAt: feedback.createdAt,
              user: {
                firstName: feedback.userId.firstName,
                lastName: feedback.userId.lastName,
              },
              project: {
                name: feedback.projectId.name,
              },
            })),
          )
        }
      }
    } catch (err) {
      logger.error(err)
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: INTERNAL_SERVER_ERROR })
    }
  })

  return router
}

export default routes
