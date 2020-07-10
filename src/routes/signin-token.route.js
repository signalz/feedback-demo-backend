import express from 'express'
import HttpStatus from 'http-status-codes'

const routes = () => {
  const router = express.Router()
  router.post('/', async (req, res) => {
    const { firstName, lastName, username, roles } = req.user
    res.status(HttpStatus.OK).json({
      username,
      firstName,
      lastName,
      roles,
    })
  })

  return router
}

export default routes
