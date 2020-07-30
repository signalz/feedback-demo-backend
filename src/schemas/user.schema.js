import Joi from '@hapi/joi'
import EmailValidator from 'email-validator'
import PasswordValidator from 'password-validator'

import { ROLE_ADMIN, ROLE_SUPERVISOR, ROLE_USER } from '../config'
import { INVALID_PASSWORD, INVALID_USERNAME } from '../constants'

// eslint-disable-next-line
const passwordSchema = new PasswordValidator().is().min(6).has().not().spaces()

const validateUsername = (value, helpers) => {
  if (!EmailValidator.validate(value)) {
    return helpers.error('username')
  }
  return value
}

const validatePassword = (value, helpers) => {
  if (!passwordSchema.validate(value)) {
    return helpers.error('password')
  }
  return value
}

export const createUserSchema = Joi.object({
  username: Joi.string().custom(validateUsername).required().messages({
    username: INVALID_USERNAME,
  }),
  password: Joi.string().custom(validatePassword).required().messages({
    password: INVALID_PASSWORD,
  }),
  firstName: Joi.string().allow('').optional(),
  lastName: Joi.string().allow('').optional(),
  roles: Joi.array()
    .items(Joi.string().valid(ROLE_USER, ROLE_ADMIN, ROLE_SUPERVISOR))
    .min(1)
    .required(),
  isDeleted: Joi.boolean().optional(),
})

export const updateUserSchema = Joi.object({
  username: Joi.string().custom(validateUsername).optional().messages({
    username: INVALID_USERNAME,
  }),
  firstName: Joi.string().allow('').optional(),
  lastName: Joi.string().allow('').optional(),
  roles: Joi.array()
    .items(Joi.string().valid(ROLE_USER, ROLE_ADMIN, ROLE_SUPERVISOR))
    .min(1)
    .optional(),
  isDeleted: Joi.boolean().optional(),
})

export const updatePasswordSchema = Joi.object({
  newPassword: Joi.string().custom(validatePassword).required().messages({
    password: INVALID_PASSWORD,
  }),
  confirmNewPassword: Joi.string().custom(validatePassword).required().messages({
    password: INVALID_PASSWORD,
  }),
})

export const selfUpdatePasswordSchema = Joi.object({
  password: Joi.string().custom(validatePassword).required().messages({
    password: INVALID_PASSWORD,
  }),
  newPassword: Joi.string().custom(validatePassword).required().messages({
    password: INVALID_PASSWORD,
  }),
  confirmNewPassword: Joi.string().custom(validatePassword).required().messages({
    password: INVALID_PASSWORD,
  }),
})
