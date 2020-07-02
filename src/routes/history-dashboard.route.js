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

    try {
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
