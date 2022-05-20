const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({

  phone: {
    type: String,
    required: [true, 'is required'],
    unique: [true, 'Phone already in use'],
    trim: true
  },
  profile_completion: {
    type: Number,
    default: 0
  },
  device: {
    type: Array
  },
  account_type: {
    type: String,
    enum: ['user', 'guardian', 'company', 'admin'],
    default: 'user'
  },
  is_blocked: {
    type: Boolean,
    default: false
  },
  creation_ip: {
    type: String,
    required: [true, 'is required']
  },
  updation_ip: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date
  }
})

userSchema.pre('save', async function save(next) {
  this.increment();
  this.updated_at = new Date;
  return next();
});

module.exports = mongoose.model('Users', userSchema)