import mongoose, { Schema } from 'mongoose'

const questionSchema = Schema(
  {
    text: { type: String, required: true },
    order: { type: Number, required: true },
  },
  { timestamps: true },
)

questionSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject()
  object.id = _id
  return object
})

const sectionSchema = Schema(
  {
    title: { type: String, required: true },
    questions: [questionSchema],
    order: { type: Number, required: true },
  },
  { timestamps: true },
)

sectionSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, questions, ...object } = this.toObject()
  object.id = _id
  return {
    ...object,
  }
})

const schema = Schema(
  {
    description: { type: String, required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: Date.now },
    sections: [sectionSchema],
  },
  { timestamps: true },
)

schema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, sections, ...object } = this.toObject()
  object.id = _id
  return {
    ...object,
    sections: sections.map((section) => ({
      id: section._id,
      title: section.title,
      order: section.order,
      questions: section.questions.map((question) => ({
        id: question._id,
        text: question.text,
        order: question.order,
      })),
    })),
  }
})

const Survey = mongoose.model('Survey', schema)

export default Survey
