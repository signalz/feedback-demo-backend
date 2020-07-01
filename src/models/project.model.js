import mongoose from 'mongoose'

const schema = mongoose.Schema({
  projectName: String,
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: Date.now
  },
  customer: String,
  domain: String
}, {
  timestamps: true
})
schema.method("toJSON", function () {
  const {
    __v,
    _id,
    createdAt,
    updatedAt,
    ...object
  } = this.toObject()
  object.id = _id
  return object
})

const Project = mongoose.model("Project", schema)

export default Project
