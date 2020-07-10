import mongoose, { Schema } from 'mongoose';

const schema = Schema(
  {
    name: String,
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: Date.now,
    },
    customer: String,
    domain: String,
    description: String,
    manager: { type: Schema.Types.ObjectId, ref: 'User' },
    associates: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    surveyId: { type: Schema.Types.ObjectId, ref: 'Survey' },
  },
  {
    timestamps: true,
    autoCreate: true,
  },
);

schema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const Project = mongoose.model('Project', schema);

export default Project;
