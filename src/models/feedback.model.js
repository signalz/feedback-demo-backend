import mongoose, { Schema } from 'mongoose'

const questionSchema = Schema(
  {
    text: { type: String, required: true },
    order: { type: Number, required: true },
    rating: { type: Number, required: true, min: 0, max: 4 },
  },
  { timestamps: true },
)

const sectionSchema = Schema(
  {
    title: { type: String, required: true },
    questions: [questionSchema],
    order: { type: Number, required: true },
  },
  { timestamps: true },
)

const schema = Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    sections: [sectionSchema],
    review: String,
    event: String,
  },
  { timestamps: true },
)
schema.method('toJSON', function () {
  const { __v, _id, updatedAt, sections, ...object } = this.toObject()
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
        rating: question.rating,
      })),
    })),
  }
})

const Feedback = mongoose.model('Feedback', schema)

export default Feedback
