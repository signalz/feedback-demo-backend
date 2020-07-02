import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import {
  ProjectRoutes,
  QuestionRoutes,
  SectionRoutes,
  SignupRoutes,
  SigninRoutes,
  SigninToken,
  SurveyRoutes,
} from './routes';
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

app.use('/signin-with-token', passport.authenticate('jwt', { session: false }), SigninToken());

app.use('/api/projects', passport.authenticate('jwt', { session: false }), ProjectRoutes());

app.use('/api/questions', QuestionRoutes());

app.use('/api/sections', SectionRoutes());

app.use('/api/surveys', SurveyRoutes());

export default app;
