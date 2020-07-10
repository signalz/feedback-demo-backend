import express from 'express'
import HttpStatus from 'http-status-codes'
import mongoose from 'mongoose'

import { INTERNAL_SERVER_ERROR } from '../constants'
import { Feedback, Project } from '../models'
import { logger, isAdmin } from '../utils'

const routes = () => {
  const router = express.Router()
  router.get('/', async (req, res) => {
    try {
      const userId = req.user.id
      const matchOpts = {}
      if (!isAdmin(req.user)) {
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
          ],
        })
        matchOpts.projectId = {
          $in: projects.map((project) => mongoose.Types.ObjectId(project.id)),
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
