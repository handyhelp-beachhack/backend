const mongoose = require('mongoose');
const validator = require('validator');

const { ObjectId } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema({

  phone: {
    type: String,
    required: [true, 'is required'],
    unique: [true, 'Phone already in use'],
    trim: true
  },
  guardian: {
    name : {
      type: String
    },
    phone: {
      type: String
    },
    status: {
      type: String
    },
    id: {
      type: ObjectId
    }
  },
  name: {
    type: String,
    minlength: 2,
    maxlength: 150,
    validate: {
      validator: function (val) {
        let result = val.replace(/ /g, '');
        return validator.isAlpha(result);
      },
      message: 'Name should contain only alphabets with or without spaces'
    },
    trim: true
  },
  account_type: {
    type: String,
    enum: ['user', 'guardian', 'company', 'admin'],
    default: 'user'
  },
  pending_guradian_connection: {
    type: Array
  },
  username: {
    type: String,
    minlength: 2,
    maxlength: 50,
    lowercase: true,
    trim: true
  },
  connected_users: [{
    type: ObjectId
  }],
  dob: {
    type: Date,
    trim: true
  },
  bio: {
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
  gender: {
    type: String,
    enum: ['male','female','others'],
    lowercase: true
  },
  handicap_type: {
    type: String,
    enum: ['deaf','dumb','blind','others'],
    lowercase: true
  },
  profile_verified: {
    type: Boolean,
    default: true
  },
  profile_completion: {
    type: Number,
    default: 0
  },
  device: [{
    name: String,
    os: String,
    os_version: String,
    fcm: String,
    app_version: String,
    token: String,
    last_login: Date,
    login_ip: String
  }],
  profile_images: {
    type: Array,
    default: []
  },
  notifications: {
    type: Array,
    default: []
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

var ID = function () {
  return Math.random().toString(36).substring(2, 9);
};

userSchema.pre('save', async function save(next) {
  this.increment();
  if(!this.username){
    this.username = ID()
  }
  this.updated_at = new Date;
  return next();
});

userSchema.index({location:"2dsphere"});

module.exports = mongoose.model('Users', userSchema)