import mongoose, { Schema } from 'mongoose';

const schema = Schema(
  {
    userId: String,
    surveyId: { type: Schema.Types.ObjectId, ref: 'Survey' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    review: String,
  },
  { timestamps: true },
);
schema.method('toJSON', () => {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const Feedback = mongoose.model('Feedback', schema);

export default Feedback;
