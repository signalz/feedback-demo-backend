import express from 'express';
import HttpStatus from 'http-status-codes';

import { Project } from '../models';
import { logger } from '../utils';

const routes = () => {
  const router = express.Router();
  router.get('/', async (req, res) => {
    try {
      const projects = await Project.find({});
      res.status(HttpStatus.OK).send(projects);
    } catch (e) {
      logger.error(e);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Internal error',
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
        message: `Internal error with project ${id}`,
      });
    }
  });

  return router;
};

export default routes;
