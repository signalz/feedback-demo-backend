import express from 'express'
import HttpStatus from 'http-status-codes'
import mongoose from 'mongoose'

import { FORBIDDEN, INTERNAL_SERVER_ERROR } from '../constants'
import { Feedback, Project } from '../models'
import { logger, isAdmin, isSupervisor } from '../utils'

const routes = () => {
  const router = express.Router()
  router.get('/', async (req, res) => {
    try {
      const userId = req.user.id
      const { projectId } = req.query
      const matchOpts = {}
      if (!projectId) {
        if (!isAdmin(req.user) && !isSupervisor(req.user)) {
          const projects = await Project.find({
            $or: [
              {
                manager: mongoose.Types.ObjectId(userId),
              },
              {
                associates: {
                  $elemMatch: {
                    $eq: mongoose.Types.ObjectId(userId),
                  },
                },
              },
              {
                views: {
                  $elemMatch: {
                    $eq: mongoose.Types.ObjectId(userId),
                  },
                },
              },
            ],
          })
          matchOpts.projectId = {
            $in: projects.map((project) => mongoose.Types.ObjectId(project.id)),
          }
        }
      } else {
        const project = await Project.findById(projectId)
        if (project) {
          matchOpts.projectId = {
            $in: [mongoose.Types.ObjectId(project.id)],
          }

          if (!isAdmin(req.user) && !isSupervisor(req.user)) {
            if (!project.manager &&
              !project.associates.includes(mongoose.Types.ObjectId(userId)) &&
              !project.views.includes(mongoose.Types.ObjectId(userId))) {
              res.status(HttpStatus.FORBIDDEN).json({
                message: FORBIDDEN,
              })
              return
            }

            if (
              project.manager.toString() !== userId &&
              !project.associates.includes(mongoose.Types.ObjectId(userId)) &&
              !project.views.includes(mongoose.Types.ObjectId(userId))
            ) {
              res.status(HttpStatus.FORBIDDEN).json({
                message: FORBIDDEN,
              })
              return
            }
          }
        } else {
          res.status(HttpStatus.BAD_REQUEST).json({
            message: 'Project not found',
          })
          return
        }
      }

      const sections = await Feedback.aggregate([
        { $match: matchOpts },
        { $unwind: '$sections' },
        { $group: { _id: null, title: { $addToSet: '$sections.title' } } },
        { $unwind: '$title' },
      ])
      res.status(HttpStatus.OK).send(sections)
    } catch (e) {
      logger.error(e)
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: INTERNAL_SERVER_ERROR,
      })
    }
  })

  return router
}

export default routes
