import Joi from '@hapi/joi';
import express from 'express';
import HttpStatus from 'http-status-codes';

import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from '../constants';
import { Survey } from '../models';
import { logger } from '../utils';

const surveyObj = Joi.object({
  description: Joi.string().required(),
  startDate: Joi.string(),
  endDate: Joi.string(),
  sections: Joi.array().items(Joi.string()),
});

const routes = () => {
  const router = express.Router();
  router.get('/', async (req, res) => {
    try {
      const surveys = await Survey.find({});
      res.status(HttpStatus.OK).send(surveys);
    } catch (e) {
      logger.error(e);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: INTERNAL_SERVER_ERROR,
      });
    }
  });

  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const survey = await Survey.findOne({ _id: id }).populate({
        path: 'sections',
        populate: {
          path: 'questions',
          model: 'Question',
        },
      });
      res.status(HttpStatus.OK).send({
        description: survey.description,
        id: survey._id,
        sections: survey.sections.map((section) => ({
          id: section._id,
          title: section.title,
          order: section.order,
          questions: section.questions.map((question) => ({
            id: question._id,
            text: question.text,
            order: question.order,
          })),
        })),
      });
    } catch (e) {
      logger.error(e);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `${INTERNAL_SERVER_ERROR} with survey ${id}`,
      });
    }
  });

  router.post('/', async (req, res) => {
    surveyObj
      .validateAsync(req.body)
      .then(async (survey) => {
        try {
          const createdSurvey = await Survey.create(survey);
          res.status(HttpStatus.OK).send(createdSurvey);
        } catch (err) {
          logger.error(err);
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

  router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    surveyObj
      .validateAsync(req.body)
      .then(async (question) => {
        try {
          const update = await Survey.findByIdAndUpdate(id, question, {
            useFindAndModify: false,
          });
          if (!update) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              message: INTERNAL_SERVER_ERROR,
            });
          } else {
            res.status(HttpStatus.OK).send({ message: 'Survey was updated successfully.' });
          }
        } catch (err) {
          logger.error(err);
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

  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const data = await Survey.deleteOne(id, { useFindAndModify: false });
      if (!data) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: INTERNAL_SERVER_ERROR,
        });
      } else {
        res.status(HttpStatus.OK).send({ message: 'Survey was deleted successfully.' });
      }
    } catch (err) {
      logger.error(err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: INTERNAL_SERVER_ERROR,
      });
    }
  });

  return router;
};

export default routes;
