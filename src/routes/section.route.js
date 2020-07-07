import Joi from '@hapi/joi';
import express from 'express';
import HttpStatus from 'http-status-codes';

import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR } from '../constants';
import { Section } from '../models';
import { logger, isAdmin } from '../utils';

const sectionObj = Joi.object({
  title: Joi.string().required(),
  order: Joi.number(),
  questions: Joi.array().items(Joi.string()).optional(),
});
const sectionsArr = Joi.array().items(sectionObj);

const routes = () => {
  const router = express.Router();
  router.get('/', async (req, res) => {
    try {
      const sections = await Section.find({});
      res.status(HttpStatus.OK).send(sections);
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
      const section = await Section.findOne({ _id: id });
      res.status(HttpStatus.OK).send(section);
    } catch (e) {
      logger.error(e);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `${INTERNAL_SERVER_ERROR} with section ${id}`,
      });
    }
  });

  router.post('/', async (req, res) => {
    if (isAdmin(req.user)) {
      sectionsArr
        .validateAsync(req.body)
        .then(async (sections) => {
          try {
            const createdSections = await Section.create(sections);
            res.status(HttpStatus.OK).send(createdSections);
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
    } else {
      res.status(HttpStatus.FORBIDDEN).json({
        message: FORBIDDEN,
      });
    }
  });

  router.patch('/:id', async (req, res) => {
    if (isAdmin(req.user)) {
      const { id } = req.params;
      sectionObj
        .validateAsync(req.body)
        .then(async (question) => {
          try {
            const update = await Section.findByIdAndUpdate(id, question, {
              useFindAndModify: false,
            });
            if (!update) {
              res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: INTERNAL_SERVER_ERROR,
              });
            } else {
              res.status(HttpStatus.OK).send({ message: 'Section was updated successfully.' });
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
    } else {
      res.status(HttpStatus.FORBIDDEN).json({
        message: FORBIDDEN,
      });
    }
  });

  router.delete('/:id', async (req, res) => {
    if (isAdmin(req.user)) {
      const { id } = req.params;
      try {
        const data = await Section.deleteOne(id, { useFindAndModify: false });
        if (!data) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: INTERNAL_SERVER_ERROR,
          });
        } else {
          res.status(HttpStatus.OK).send({ message: 'Section was deleted successfully.' });
        }
      } catch (err) {
        logger.error(err);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: INTERNAL_SERVER_ERROR,
        });
      }
    } else {
      res.status(HttpStatus.FORBIDDEN).json({
        message: FORBIDDEN,
      });
    }
  });

  return router;
};

export default routes;
