import mongoose, { Schema } from 'mongoose';

import { ROLE_ADMIN, ROLE_USER } from '../config';

const schema = Schema({
  username: String,
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

const User = mongoose.model('User', schema);

export default User;
