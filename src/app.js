import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import {
  FeedbackRoutes,
  HistoryDashboardRoutes,
  OverviewDashboardRoutes,
  ProjectRoutes,
  SectionRoutes,
  SignupRoutes,
  SigninRoutes,
  SigninToken,
  SurveyRoutes,
  UserRoutes,
} from './routes';
import passport, { generateToken } from './middlewares/authentication';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(morgan('dev'));

app.use('/signup', passport.authenticate('jwt', { session: false }), SignupRoutes());
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

app.use('/api/sections', passport.authenticate('jwt', { session: false }), SectionRoutes());

app.use('/api/surveys', passport.authenticate('jwt', { session: false }), SurveyRoutes());

app.use('/api/feedbacks', passport.authenticate('jwt', { session: false }), FeedbackRoutes());

app.use(
  '/api/dashboard/projects/summary',
  passport.authenticate('jwt', { session: false }),
  OverviewDashboardRoutes(),
);

app.use(
  '/api/dashboard/projects/history',
  passport.authenticate('jwt', { session: false }),
  HistoryDashboardRoutes(),
);

app.use('/api/users', passport.authenticate('jwt', { session: false }), UserRoutes());

export default app;
