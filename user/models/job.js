const mongoose = require('mongoose');
const validator = require('validator');

const { ObjectId } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema({

  posted_by: {
    type: ObjectId
  },
  contact_number: {
    type: String
  },
  name: {
    type: String,
    minlength: 2,
    maxlength: 350,
    trim: true
  },
  job_type: {
    type: String,
    enum: ['full-time', 'part-time'],
    default: 'full-time'
  },
  job_id: {
    type: String,
    minlength: 2,
    maxlength: 50,
    lowercase: true,
    trim: true
  },
  end_date: {
    type: Date
  },
  description: {
    type: String,
    minlength: 2,
    maxlength: 500,
    trim: true
  },
  lpa: {
    type : Number
  },
  handicap_type: {
    type: String,
    enum: ['deaf','dumb','blind','others'],
    lowercase: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date
  }
})

var ID = function () {
  return Math.random().toString(36).substring(2, 9);
};

userSchema.pre('save', async function save(next) {
  if(!this.job_id){
    this.job_id = ID()
  }
  this.updated_at = new Date;
  return next();
});

module.exports = mongoose.model('Jobs', userSchema)