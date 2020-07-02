import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { SignupRoutes, SigninRoutes, SigninToken } from './routes';
import passport, { generateToken } from './middlewares/authentication';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(morgan('dev'));

app.use('/signup', SignupRoutes());
app.use(
  '/signin',
  passport.authenticate('local', {
    session: false,
  }),
  generateToken,
  SigninRoutes(),
);

app.use(
  '/signin-with-token',
  passport.authenticate('jwt', { session: false }),
  SigninToken(),
);

export default app;
