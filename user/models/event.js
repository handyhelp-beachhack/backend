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
  event_id: {
    type: String,
    minlength: 2,
    maxlength: 50,
    lowercase: true,
    trim: true
  },
  event_date: {
    type: Date
  },
  description: {
    type: String,
    minlength: 2,
    maxlength: 500,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default:'Point'
    },
    coordinates: {
      type: [Number]
    }
  },
  img: {
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

var ID = function () {
  return Math.random().toString(36).substring(2, 9);
};

userSchema.pre('save', async function save(next) {
  if(!this.event_id){
    this.event_id = ID()
  }
  this.updated_at = new Date;
  return next();
});

userSchema.index({location:"2dsphere"});

module.exports = mongoose.model('Events', userSchema)