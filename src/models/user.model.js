import mongoose, { Schema } from 'mongoose';

import { ROLE_ADMIN, ROLE_USER } from '../config';

const schema = Schema({
  username: {
    type: String,
    unique: true,
  },
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  roles: [
    {
      type: String,
      enum: [ROLE_ADMIN, ROLE_USER],
      default: ROLE_USER,
    },
  ],
});

schema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const User = mongoose.model('User', schema);

export default User;
