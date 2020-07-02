import mongoose, { Schema } from 'mongoose';

const schema = Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    feedbackId: { type: Schema.Types.ObjectId, ref: 'Feedback' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section' },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
    customer: String,
    domain: String,
    rating: { type: Number, required: true, min: 0, max: 4 },
  },
  { timestamps: true },
);
schema.method('toJSON', () => {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const Rating = mongoose.model('Rating', schema);

export default Rating;
