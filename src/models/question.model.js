import mongoose from 'mongoose';

const schema = mongoose.Schema(
  {
    text: { type: String, required: true, min: 1, max: 200 },
    order: Number,
  },
  { timestamps: true },
);
schema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const Question = mongoose.model('Question', schema);

export default Question;
