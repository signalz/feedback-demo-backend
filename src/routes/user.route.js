import Joi from '@hapi/joi';
import bcrypt from 'bcryptjs';
import express from 'express';
import HttpStatus from 'http-status-codes';

import { BCRYPT_SALT } from '../config';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from '../constants';
import { User } from '../models';
import { logger } from '../utils';

const schema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  email: Joi.string().optional(),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
});

const routes = () => {
  const router = express.Router();
  router.post('/', async (req, res) => {
    schema
      .validateAsync(req.body)
      .then(async (user) => {
        try {
          await User.create({
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            password: bcrypt.hashSync(user.password, BCRYPT_SALT),
          });
          res.status(HttpStatus.OK).json({
            message: 'User created',
          });
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

  router.get('/', async (req, res) => {
    try {
      const users = await User.find({}).select(['-password', '-__v']);
      res.status(HttpStatus.OK).send(users);
    } catch (e) {
      logger.error(e);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: INTERNAL_SERVER_ERROR,
      });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      await User.deleteOne({ _id: id });
      res.status(HttpStatus.OK).json({
        message: 'User is deleted successfully',
      });
    } catch (e) {
      logger.error(e);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: INTERNAL_SERVER_ERROR,
      });
    }
  });

  router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    let { password } = req.body;

    if (password) {
      password = bcrypt.hashSync(password, BCRYPT_SALT);
    }

    try {
      await User.findByIdAndUpdate(
        id,
        { ...req.body, password },
        {
          useFindAndModify: false,
        },
      );
      res.status(HttpStatus.OK).send({ message: 'User was updated successfully.' });
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
