import mongoose from 'mongoose';

const schema = mongoose.Schema(
  {
    title: { type: String, required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    order: Number,
  },
  { timestamps: true },
);
schema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  const questions = object.questions.map((q) => ({ id: q._id, order: q.order, text: q.text }));
  object.questions = questions;
  return object;
});

const Section = mongoose.model('Section', schema);

export default Section;
