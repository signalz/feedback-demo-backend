import Joi from '@hapi/joi'

const createFeedbackSchema = Joi.object({
  projectId: Joi.string().required(),
  sections: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().required(),
        order: Joi.number().min(0).required(),
        questions: Joi.array()
          .items(
            Joi.object({
              text: Joi.string().required(),
              order: Joi.number().min(0).required(),
              rating: Joi.number().min(0).max(4).required(),
            }),
          )
          .min(1)
          .required(),
      }),
    )
    .min(1)
    .required(),
  review: Joi.string().allow('').optional(),
  event: Joi.string().allow('').optional(),
})

export default createFeedbackSchema
