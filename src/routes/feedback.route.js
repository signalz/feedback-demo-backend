import Joi from '@hapi/joi';
import express from 'express';
import HttpStatus from 'http-status-codes';

import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from '../constants';
import { Feedback, Project, Rating } from '../models';
import { logger } from '../utils';

const schema = Joi.object({
  surveyId: Joi.string().required(),
  projectId: Joi.string().required(),
  review: Joi.string(),
  event: Joi.string(),
  ratings: Joi.array().items(
    Joi.object({
      sectionId: Joi.string(),
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
        const userId = req.user._id;
        const { surveyId, projectId, review, event, ratings } = feedback;
        try {
          const newFeedback = await Feedback.create({
            userId,
            surveyId,
            projectId,
            review,
            event,
          });

          const project = await Project.findById(projectId);

          if (!project) {
            throw new Error('Project not found');
          }

          const promiseArray = [];
          /* eslint-disable */
          ratings.map((rating) =>
            rating.questions.map((question) =>
              promiseArray.concat(
                Rating.create({
                  userId,
                  projectId,
                  feedbackId: newFeedback._id,
                  customer: project.customer,
                  domain: project.domain,
                  sectionId: rating.sectionId,
                  questionId: question.questionId,
                  rate: question.rating,
                }),
              ),
            ),
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

  return router;
};

export default routes;
