import Joi from '@hapi/joi'

export const createFeedbackSchema = Joi.object({
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
              rating: Joi.number().min(0).max(4).optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
  review: Joi.string().allow('').optional(),
  event: Joi.string().allow('').optional(),
})

export const editFeedbackSchema = Joi.object({
  feedbackId: Joi.string().required(),
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
              rating: Joi.number().min(0).max(4).optional(),
              comment: Joi.string().allow('').optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
})
