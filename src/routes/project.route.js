import Joi from '@hapi/joi';
import express from 'express';
import HttpStatus from 'http-status-codes';

import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from '../constants';
import { Project } from '../models';
import { logger } from '../utils';

const projectObj = Joi.object({
  name: Joi.string().required(),
  startDate: Joi.string(),
  endDate: Joi.string(),
  customer: Joi.string(),
  domain: Joi.string(),
  manager: Joi.string(),
  surveyId: Joi.string(),
});
const projectArr = Joi.array().items(projectObj);

const routes = () => {
  const router = express.Router();
  router.get('/', async (req, res) => {
    try {
      const projects = await Project.find({});
      res.status(HttpStatus.OK).send(projects);
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
      const project = await Project.findOne({ _id: id });
      res.status(HttpStatus.OK).send(project);
    } catch (e) {
      logger.error(e);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `${INTERNAL_SERVER_ERROR} with project ${id}`,
      });
    }
  });

  router.post('/', async (req, res) => {
    projectArr
      .validateAsync(req.body)
      .then(async (projects) => {
        try {
          const createdProjects = await Project.create(projects);
          res.status(HttpStatus.OK).send(createdProjects);
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
    projectObj
      .validateAsync(req.body)
      .then(async (project) => {
        try {
          const update = await Project.findByIdAndUpdate(id, project, { useFindAndModify: false });
          if (!update) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              message: INTERNAL_SERVER_ERROR,
            });
          } else {
            res.status(HttpStatus.OK).send({ message: 'Project was updated successfully.' });
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
      const data = await Project.deleteOne(id, { useFindAndModify: false });
      if (!data) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: INTERNAL_SERVER_ERROR,
        });
      } else {
        res.status(HttpStatus.OK).send({ message: 'Project was deleted successfully.' });
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
