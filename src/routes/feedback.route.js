import Joi from '@hapi/joi';
import express from 'express';
import HttpStatus from 'http-status-codes';
import mongoose from 'mongoose';

import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR } from '../constants';
import { Feedback, Project, Rating } from '../models';
import { logger, isAdmin } from '../utils';

const schema = Joi.object({
  surveyId: Joi.string().required(),
  projectId: Joi.string().required(),
  review: Joi.string().allow('').optional(),
  event: Joi.string().allow('').optional(),
  ratings: Joi.array().items(
    Joi.object({
      sectionId: Joi.string().required(),
      questions: Joi.array().items(
        Joi.object({
          questionId: Joi.string().required(),
          rating: Joi.number().optional(),
        }),
      ),
    }),
  ),
});

const routes = () => {
  const router = express.Router();
  router.post('/', async (req, res) => {
    schema
      .validateAsync(req.body)
      .then(async (feedback) => {
        const userId = req.user.id;
        const { surveyId, projectId, review, event, ratings } = feedback;
        try {
          const project = await Project.findById(projectId);

          if (!project) {
            logger.error(`Project ${projectId} was not found`);
            res.status(HttpStatus.BAD_REQUEST).json({
              message: BAD_REQUEST,
            });
          } else {
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

            const newFeedback = await Feedback.create({
              userId,
              surveyId,
              projectId,
              review,
              event,
            });

            const promiseArray = [];
            /* eslint-disable */
            ratings.map((rating) =>
              rating.questions.map((question) => {
                if (question.rating) {
                  promiseArray.concat(
                    Rating.create({
                      userId,
                      projectId,
                      feedbackId: newFeedback._id,
                      customer: project.customer,
                      domain: project.domain,
                      sectionId: rating.sectionId,
                      questionId: question.questionId,
                      rating: question.rating,
                    }),
                  );
                }
              }),
            );
            /* eslint-enable */
            Promise.all(promiseArray)
              .then(() => {
                res.status(HttpStatus.OK).send({
                  message: 'Feedback saved',
                });
              })
              .catch((e) => {
                throw new Error(e);
              });
          }
        } catch (error) {
          logger.error(error);
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: INTERNAL_SERVER_ERROR,
          });
        }
      })
      .catch((e) => {
        logger.error(e);
        res.status(HttpStatus.BAD_REQUEST).json({
          message: BAD_REQUEST,
        });
      });
  });

  // get latest feedback
  router.get('/', async (req, res) => {
    const userId = req.user.id;
    const { projectId, surveyId } = req.query;

    try {
      const feedback = await Feedback.findOne(
        { surveyId, projectId, userId },
        {},
        {
          sort: { createdAt: -1 },
        },
      );
      if (!feedback) {
        res.status(HttpStatus.NOT_FOUND).send({
          message: `Not found Feedback with surveyId ${surveyId}, projectId ${projectId} and userId ${userId}`,
        });
      } else {
        const ratings = await Rating.find({ projectId, userId, feedbackId: feedback.id });
        const sectionIds = [...new Set(ratings.map((rating) => rating.sectionId.toString()))];
        const sections = sectionIds.map((section) => ({ sectionId: section, questions: [] }));

        ratings.forEach((rating) => {
          sections.forEach((section) => {
            if (section.sectionId === rating.sectionId.toString()) {
              section.questions.push({ questionId: rating.questionId, rating: rating.rating });
            }
          });
        });

        res.status(HttpStatus.OK).json({
          id: feedback.id,
          review: feedback.review,
          event: feedback.event,
          ratings: sections,
        });
      }
    } catch (err) {
      logger.error(err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: INTERNAL_SERVER_ERROR });
    }
  });

  // get feedback history
  router.get('/history', async (req, res) => {
    const userId = req.user.id;
    const { projectId, surveyId } = req.query;

    try {
      const feedbacks = await Feedback.find(
        { surveyId, projectId, userId },
        {},
        {
          sort: { createdAt: -1 },
        },
      );

      Promise.all(
        feedbacks.map(async (feedback) => {
          const ratings = await Rating.find({ projectId, userId, feedbackId: feedback.id });
          const sectionIds = [...new Set(ratings.map((rating) => rating.sectionId.toString()))];
          const sections = sectionIds.map((section) => ({ sectionId: section, questions: [] }));

          ratings.forEach((rating) => {
            sections.forEach((section) => {
              if (section.sectionId === rating.sectionId.toString()) {
                section.questions.push({ questionId: rating.questionId, rating: rating.rating });
              }
            });
          });

          return {
            id: feedback.id,
            review: feedback.review,
            event: feedback.event,
            ratings: sections,
          };
        }),
      )
        .then((values) => res.status(HttpStatus.OK).send(values))
        .catch((e) => {
          throw new Error(e);
        });
    } catch (err) {
      logger.error(err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: INTERNAL_SERVER_ERROR });
    }
  });

  return router;
};

export default routes;
