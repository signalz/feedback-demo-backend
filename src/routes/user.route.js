import Joi from '@hapi/joi';
import bcrypt from 'bcryptjs';
import express from 'express';
import HttpStatus from 'http-status-codes';

import { BCRYPT_SALT, ROLE_ADMIN, ROLE_USER } from '../config';
import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR } from '../constants';
import { User } from '../models';
import { logger, isAdmin } from '../utils';

const schema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  email: Joi.string().allow('').optional(),
  firstName: Joi.string().allow('').optional(),
  lastName: Joi.string().allow('').optional(),
  roles: Joi.array().items(Joi.string().valid(ROLE_USER, ROLE_ADMIN)).required(),
});

const routes = () => {
  const router = express.Router();
  router.post('/', async (req, res) => {
    if (isAdmin(req.user)) {
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
              message: 'User is created successfully',
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
    } else {
      res.status(HttpStatus.FORBIDDEN).json({
        message: FORBIDDEN,
      });
    }
  });

  router.get('/', async (req, res) => {
    if (isAdmin(req.user)) {
      try {
        const users = await User.find({}).select(['-password', '-__v']);
        res.status(HttpStatus.OK).send(users);
      } catch (e) {
        logger.error(e);
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

  router.delete('/:id', async (req, res) => {
    if (isAdmin(req.user)) {
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
    } else {
      res.status(HttpStatus.FORBIDDEN).json({
        message: FORBIDDEN,
      });
    }
  });

  router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    let { password } = req.body;

    if (isAdmin(req.user) || id === req.user.id) {
      if (password) {
        password = bcrypt.hashSync(password, BCRYPT_SALT);
        req.body.password = password;
      }

      try {
        await User.findByIdAndUpdate(
          id,
          { ...req.body },
          {
            useFindAndModify: false,
            runValidators: true,
          },
        );
        res.status(HttpStatus.OK).send({ message: 'User was updated successfully.' });
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
