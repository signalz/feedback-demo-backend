import Joi from '@hapi/joi'

const createProjectSchema = Joi.object({
  name: Joi.string().required(),
  manager: Joi.string().allow('').optional(),
  surveyId: Joi.string().allow('').optional(),
  associates: Joi.array().items(Joi.string().allow('').optional()),
  description: Joi.string().allow('').optional(),
})

export default createProjectSchema
