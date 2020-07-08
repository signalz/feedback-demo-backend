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

    const matchOpts = {};
    const groupId = {};

    if (customer) {
      matchOpts.customer = customer;
      groupId.customer = '$customer';
    }

    if (domain) {
      matchOpts.domain = domain;
      groupId.domain = '$domain';
    }

    if (projectId) {
      const project = await Project.findById(projectId);
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
      groupId.projectId = '$projectId';
    } else if (!projectId) {
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

    if (sectionId) {
      matchOpts.sectionId = mongoose.Types.ObjectId(sectionId);
      groupId.sectionId = '$sectionId';
    }

    // if (customer) groupId.customer = '$customer';
    // if (domain) groupId.domain = '$domain';
    // if (projectId) groupId.projectId = '$projectId';
    // if (sectionId) groupId.sectionId = '$sectionId';
    groupId.rating = '$rating';

    try {
      const data = await Rating.aggregate([
        {
          $match: matchOpts,
        },
        {
          $group: {
            _id: groupId,
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      if (data) {
        const output = {
          PLATINUM: 0,
          GOLD: 0,
          SILVER: 0,
          BRONZE: 0,
        };
        data.forEach((ele) => {
          if (ele._id.rating === 4) output.PLATINUM = ele.count;
          if (ele._id.rating === 3) output.GOLD = ele.count;
          if (ele._id.rating === 2) output.SILVER = ele.count;
          if (ele._id.rating === 1) output.BRONZE = ele.count;
        });
        res.status(HttpStatus.OK).send(output);
      } else {
        res.status(HttpStatus.BAD_REQUEST).send({ message: BAD_REQUEST });
      }
    } catch (err) {
      logger.error(err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: INTERNAL_SERVER_ERROR });
    }
  });

  return router;
};

export default routes;
