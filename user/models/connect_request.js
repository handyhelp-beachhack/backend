const mongoose = require('mongoose');
const validator = require('validator');

const { ObjectId } = mongoose.Schema.Types;

const connectRequestSchema = new mongoose.Schema({
  requester: {
    type: ObjectId
  },
  receiver: {
    type: ObjectId
  },
  request_date: {
    type: Date,
    default: Date.now
  },
  rejected_date: {
    type: Date
  },
  status: {
    type: String,
    validate: {
      validator: function (val) {
        var re = /^sent$|^rejected$/g;
        if (!re.test(val)) {
          return false;
        }
        return true;
      },
      message: 'Invalid status (accepted values : sent, accepted and rejected)'
    },
    default: 'sent'
  }
})

module.exports = mongoose.model('Connect_Requests', connectRequestSchema)