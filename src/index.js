// import '@babel/polyfill';
// import 'core-js/stable';
import 'regenerator-runtime/runtime.js';
import mongoose from 'mongoose';

import app from './app';
import { DB_URL } from './config';
import { logger } from './utils';

const port = process.env.PORT || 3000;
let server;

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

mongoose
  .connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    logger.info('Connected to MongoDB');
    app.get('/', (req, res) => res.send('Hello World!'));

    server = app.listen(port, () => {
      logger.info(`Listening to port ${port}`);
    });
  })
  .catch(unexpectedErrorHandler);

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
