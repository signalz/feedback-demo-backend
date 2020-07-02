import express from 'express';
import HttpStatus from 'http-status-codes';
import mongoose from 'mongoose';

import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from '../constants';
import { Rating } from '../models';
import { logger } from '../utils';

const routes = () => {
  const router = express.Router();
  router.post('/', async (req, res) => {
    const { customer, domain, projectId, sectionId } = req.body;

    const matchOpts = {};
    if (customer) matchOpts.customer = customer;
    if (domain) matchOpts.domain = domain;
    if (projectId) matchOpts.projectId = mongoose.Types.ObjectId(projectId);
    if (sectionId) matchOpts.sectionId = mongoose.Types.ObjectId(sectionId);

    const groupId = {};
    if (customer) groupId.customer = '$customer';
    if (domain) groupId.domain = '$domain';
    if (projectId) groupId.projectId = '$projectId';
    if (sectionId) groupId.sectionId = '$sectionId';
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
