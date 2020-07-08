import express from 'express';
import HttpStatus from 'http-status-codes';
import mongoose from 'mongoose';

import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR } from '../constants';
import { Project, Rating } from '../models';
import { logger, isAdmin } from '../utils';

const routes = () => {
  const router = express.Router();
  router.post('/', async (req, res) => {
    const userId = req.user.id;
    const { customer, domain, projectId, sectionId } = req.body;
    try {
      const matchOpts = {};
      if (projectId) {
        const project = await Project.findById(projectId);
        if (!project.manager && !isAdmin(req.user)) {
          res.status(HttpStatus.FORBIDDEN).json({
            message: FORBIDDEN,
          });
          return;
        }

        if (
          project.manager.toString() !== userId &&
          !project.associates.includes(mongoose.Types.ObjectId(userId)) &&
          !isAdmin(req.user)
        ) {
          res.status(HttpStatus.FORBIDDEN).json({
            message: FORBIDDEN,
          });
          return;
        }
        matchOpts.projectId = mongoose.Types.ObjectId(projectId);
      } else if (projectId) {
        if (!isAdmin(req.user)) {
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
          });

          matchOpts.projectId = {
            $in: projects.map((project) => mongoose.Types.ObjectId(project.id)),
          };
        }
      }
      if (customer) matchOpts.customer = customer;
      if (domain) matchOpts.domain = domain;
      if (sectionId) matchOpts.sectionId = mongoose.Types.ObjectId(sectionId);

      const data = await Rating.aggregate([
        {
          $match: matchOpts,
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            },
            rating: { $avg: '$rating' },
          },
        },
      ]);

      if (data) {
        res.send(
          data.map((ele) => ({
            date: ele._id.date,
            rating: ele.rating.toFixed(2),
          })),
        );
      } else res.status(HttpStatus.BAD_REQUEST).send({ message: BAD_REQUEST });
    } catch (err) {
      logger.error(err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: INTERNAL_SERVER_ERROR });
    }
  });

  return router;
};

export default routes;
