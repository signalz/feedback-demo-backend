import Joi from '@hapi/joi';
import express from 'express';
import HttpStatus from 'http-status-codes';
import mongoose from 'mongoose';

import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR } from '../constants';
import { Project } from '../models';
import { logger, isAdmin } from '../utils';

const projectObj = Joi.object({
  name: Joi.string().required(),
  startDate: Joi.string().allow('').optional(),
  endDate: Joi.string().allow('').optional(),
  customer: Joi.string().allow('').optional(),
  domain: Joi.string().allow('').optional(),
  manager: Joi.string().allow('').optional(),
  surveyId: Joi.string().allow('').optional(),
  associates: Joi.array().items(Joi.string().allow('').optional()),
});
const projectArr = Joi.array().items(projectObj);

const routes = () => {
  const router = express.Router();
  router.get('/', async (req, res) => {
    try {
      let projects;

      if (isAdmin(req.user)) {
        projects = await Project.find({})
          .populate({ path: 'manager' })
          .populate({ path: 'associates' })
          .populate({ path: 'surveyId' });
      } else {
        projects = await Project.find({
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
        })
          .populate({ path: 'manager' })
          .populate({ path: 'associates' }) // TODO: remove populate associates for user
          .populate({ path: 'surveyId' });
      }
      res.status(HttpStatus.OK).send(
        projects.map(
          ({ name, id, startDate, endDate, customer, domain, manager, associates, surveyId }) => ({
            id,
            name,
            startDate,
            endDate,
            customer,
            domain,
            manager: {
              id: manager && manager.id,
              firstName: manager && manager.firstName,
              lastName: manager && manager.lastName,
            },
            associates: associates.map((associate) => ({
              id: associate && associate.id,
              firstName: associate && associate.firstName,
              lastName: associate && associate.lastName,
            })),
            survey: {
              id: surveyId && surveyId.id,
              description: surveyId && surveyId.description,
            },
          }),
        ),
      );
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
      if (
        project.manager === req.user.id ||
        project.associates.includes(req.user.id) ||
        isAdmin(req.user)
      ) {
        res.status(HttpStatus.OK).send(project);
      } else {
        res.status(HttpStatus.FORBIDDEN).json({
          message: FORBIDDEN,
        });
      }
    } catch (e) {
      logger.error(e);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `${INTERNAL_SERVER_ERROR} with project ${id}`,
      });
    }
  });

  router.post('/', async (req, res) => {
    if (isAdmin(req.user)) {
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
    } else {
      res.status(HttpStatus.FORBIDDEN).json({
        message: FORBIDDEN,
      });
    }
  });

  router.patch('/:id', async (req, res) => {
    if (isAdmin(req.user)) {
      const { id } = req.params;
      projectObj
        .validateAsync(req.body)
        .then(async (project) => {
          try {
            const update = await Project.findByIdAndUpdate(id, project, {
              useFindAndModify: false,
            });
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
        await Project.deleteOne({ id });
        res.status(HttpStatus.OK).send({ message: 'Project was deleted successfully.' });
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
