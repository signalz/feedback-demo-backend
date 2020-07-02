import Joi from '@hapi/joi';
import express from 'express';
import HttpStatus from 'http-status-codes';

import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from '../constants';
import { Question } from '../models';
import { logger } from '../utils';

const questionObj = Joi.object({
  text: Joi.string().required(),
  order: Joi.number(),
});
const questionsArr = Joi.array().items(questionObj);

const routes = () => {
  const router = express.Router();
  router.get('/', async (req, res) => {
    try {
      const questions = await Question.find({});
      res.status(HttpStatus.OK).send(questions);
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
      const question = await Question.findOne({ _id: id });
      res.status(HttpStatus.OK).send(question);
    } catch (e) {
      logger.error(e);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `${INTERNAL_SERVER_ERROR} with question ${id}`,
      });
    }
  });

  router.post('/', async (req, res) => {
    questionsArr
      .validateAsync(req.body)
      .then(async (questions) => {
        try {
          const createdQuestions = await Question.create(questions);
          res.status(HttpStatus.OK).send(createdQuestions);
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
    questionObj
      .validateAsync(req.body)
      .then(async (question) => {
        try {
          const update = await Question.findByIdAndUpdate(id, question, {
            useFindAndModify: false,
          });
          if (!update) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              message: INTERNAL_SERVER_ERROR,
            });
          } else {
            res.status(HttpStatus.OK).send({ message: 'Question was updated successfully.' });
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
      const data = await Question.deleteOne(id, { useFindAndModify: false });
      if (!data) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: INTERNAL_SERVER_ERROR,
        });
      } else {
        res.status(HttpStatus.OK).send({ message: 'Question was deleted successfully.' });
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
