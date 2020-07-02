import mongoose from 'mongoose';

const schema = mongoose.Schema(
  {
    description: String,
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: Date.now },
    sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
  },
  { timestamps: true },
);
schema.method('toJSON', () => {
  const {
    __v,
    _id,
    createdAt,
    updatedAt,
    ...object
  } = this.toObject();
  object.id = _id;
  return object;
});

const Survey = mongoose.model('Survey', schema);

export default Survey;
