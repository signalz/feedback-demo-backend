import express from 'express';
import HttpStatus from 'http-status-codes';

const routes = () => {
  const router = express.Router();
  router.post('/', async (req, res) => {
    res.status(HttpStatus.OK).json({
      token: req.token,
      username: req.user.username,
      email: req.user.email,
    });
  });

  return router;
};

export default routes;
