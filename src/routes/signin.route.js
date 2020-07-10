import express from 'express';
import HttpStatus from 'http-status-codes';

const routes = () => {
  const router = express.Router();
  router.post('/', async (req, res) => {
    const { firstName, lastName, username, roles } = req.user;
    res.status(HttpStatus.OK).json({
      token: req.token,
      firstName,
      lastName,
      username,
      roles,
    });
  });

  return router;
};

export default routes;
