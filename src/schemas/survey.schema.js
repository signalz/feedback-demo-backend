import Joi from '@hapi/joi'

const createSurveySchema = Joi.object({
  description: Joi.string().required(),
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
            }),
          )
          .min(1)
          .required(),
      }),
    )
    .min(1)
    .required(),
})

export default createSurveySchema
