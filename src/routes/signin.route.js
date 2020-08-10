import express from 'express'
import HttpStatus from 'http-status-codes'

import { User } from '../models'

const routes = () => {
  const router = express.Router()
  router.post('/', async (req, res) => {
    const { firstName, lastName, username, roles, id } = req.user
    // clear requestReset (reset password)
    await User.findByIdAndUpdate(
      id,
      {
        requestReset: [],
      },
      {
        useFindAndModify: false,
        runValidators: true,
      },
    )
    res.status(HttpStatus.OK).json({
      token: req.token,
      firstName,
      lastName,
      username,
      roles,
      id,
    })
  })

  return router
}

export default routes
