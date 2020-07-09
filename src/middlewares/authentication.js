import bcrypt from 'bcryptjs'
// import HttpStatus from 'http-status-codes';
import jwt from 'jsonwebtoken'
import passport from 'passport'
import passportJWT from 'passport-jwt'
import Strategy from 'passport-local'

import { SERVER_KEY, TOKEN_EXPIRES } from '../config'
import { User } from '../models'
import { logger } from '../utils'

const JWTStrategy = passportJWT.Strategy
const ExtractJWT = passportJWT.ExtractJwt

passport.use(
  new Strategy(async (username, password, done) => {
    try {
      const user = await User.findOne({
        username,
      }).select(['-__v'])
      // user existed
      if (user) {
        if (!user.isDeleted) {
          // compare password
          if (bcrypt.compareSync(password, user.password)) {
            done(null, user)
          } else {
            done(null, false)
          }
        } else {
          done(null, false)
        }
      } else {
        done(null, false)
      }
    } catch (e) {
      logger.error(e)
      done(null, false)
    }
  }),
)

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: SERVER_KEY,
    },
    async (jwtPayload, next) => {
      const { id, exp } = jwtPayload
      try {
        const user = await User.findOne({
          _id: id,
        })

        if (user) {
          if (exp * 1000 < new Date().getTime()) {
            return next(null, false)
          }

          return next(null, user)
        }
      } catch (e) {
        logger.error(e)
      }

      return next()
    },
  ),
)

export const generateToken = (req, res, next) => {
  req.token = jwt.sign(
    {
      id: req.user.id,
    },
    SERVER_KEY,
    {
      expiresIn: TOKEN_EXPIRES,
    },
  )
  next()
}

export default passport
