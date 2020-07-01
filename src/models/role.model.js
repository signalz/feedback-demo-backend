import mongoose from 'mongoose';

const schema = mongoose.Schema({
  name: {
    type: String,
    enum: ['ADMIN, USER'],
    default: 'USER',
  },
});

const Role = mongoose.model('Role', schema);

export default Role;
