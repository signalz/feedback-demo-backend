import express from 'express'
import HttpStatus from 'http-status-codes'
import mongoose from 'mongoose'

import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR } from '../constants'
import { Project, Feedback } from '../models'
import { logger, isAdmin, isSupervisor } from '../utils'

const routes = () => {
  const router = express.Router()
  router.post('/', async (req, res) => {
    const userId = req.user.id
    const { projectId, sectionTitle } = req.body
    try {
      const matchOpts = {}
      // const groupId = {}

      if (projectId) {
        const project = await Project.findById(projectId)
        if (!isAdmin(req.user) && !isSupervisor(req.user)) {
          if (!project.manager && !project.associates.includes(mongoose.Types.ObjectId(userId))) {
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

        matchOpts.projectId = mongoose.Types.ObjectId(projectId)
        // groupId.projectId = '$projectId'
      } else if (!projectId) {
        if (!isAdmin(req.user) && !isSupervisor(req.user)) {
          const projects = await Project.find({
            $or: [
              {
                manager: mongoose.Types.ObjectId(req.user.id),
              },
              {
                associates: {
                  $elemMatch: {
                    $eq: mongoose.Types.ObjectId(req.user.id),
                  },
                },
              },
            ],
          })

          matchOpts.projectId = {
            $in: projects.map((project) => mongoose.Types.ObjectId(project.id)),
          }
        }
      }

      if (sectionTitle) {
        matchOpts['sections.title'] = sectionTitle
      }

      const data = await Feedback.aggregate([
        { $unwind: '$sections' },
        { $unwind: '$sections.questions' },
        {
          $addFields: {
            rating: '$sections.questions.rating',
          },
        },
        { $match: matchOpts },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 },
          },
        },
      ])

      if (data) {
        const output = {
          PLATINUM: 0,
          GOLD: 0,
          SILVER: 0,
          BRONZE: 0,
        }
        data.forEach((ele) => {
          if (ele._id === 4) output.PLATINUM = ele.count
          if (ele._id === 3) output.GOLD = ele.count
          if (ele._id === 2) output.SILVER = ele.count
          if (ele._id === 1) output.BRONZE = ele.count
        })
        res.status(HttpStatus.OK).send(output)
      } else {
        res.status(HttpStatus.BAD_REQUEST).send({ message: BAD_REQUEST })
      }
    } catch (err) {
      logger.error(err)
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: INTERNAL_SERVER_ERROR })
    }
  })

  return router
}

export default routes
