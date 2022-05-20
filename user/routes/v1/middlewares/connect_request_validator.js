const mongoose = require('../../../services/mongo_db');
const request = require('../../../models/connect_request');

// Response
const { resp } = require("../data/response");

const lock_duration = 1440;

function isSentableChecker(req, res, next) {

  if (req.temp_user.connected_users.includes(req.other_user._id.toString())) {
    return res.status(200).json({ "response_code": 400, "message": resp["already-con"], "response" : null });
  }

  request.findOne({ requester: req.temp_user._id, receiver: req.other_user._id })
    .then(data => {
      if (data == null) {
        request.findOne({ requester: req.other_user._id, receiver: req.temp_user._id })
          .then(data => {
            if (data == null) { return next(); }
            if (data.status == 'sent') { return res.status(200).json({ "response_code": 400, "message": resp["already-con-received"], "response" : null }); }
            data.remove()
              .then(data => {
                next();
              })
              .catch(err => {
                console.log(err);
                return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
              })
          })
          .catch(err => {
            console.log(err);
            return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
          })
      } else {
        if (data.status == 'sent') { return res.status(200).json({ "response_code": 400, "message": resp["already-con-pending"], "response" : null }); }
        else if (data.status == 'rejected' && !(addMinutes(new Date(data.rejected_date), lock_duration)) <= new Date()) { return res.status(200).send({ "response_code": 400, "message": `Your connect request was denied in less than ${lock_duration / 60} hours by the receiver, please try after sometime`, "response" : null  }) }
        data.remove()
          .then(data => {
            next();
          })
          .catch(err => {
            console.log(err);
            return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
          })
      }
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
    })
}

function isRejectableChecker(req, res, next) {

  request.findOne({ requester: req.other_user._id, receiver: req.temp_user._id })
    .then(data => {
      if (data == null) {
        return res.status(200).json({ "response_code": 400, "message": resp["connect-req-not-found"], "response" : null });
      } else {
        if(data.status=='rejected') { return res.status(200).json({ "response_code": 400, "message": resp["connect-req-already-rejected"], "response" : null }); }
        req.temp_request = data
        next()
      }
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
    })
}

function isAcceptableChecker(req, res, next) {

  request.findOne({ requester: req.other_user._id, receiver: req.temp_user._id })
    .then(data => {
      if (data == null) {
        return res.status(200).json({ "response_code": 400, "message": resp["connect-req-not-found"], "response" : null });
      } else {
        if(data.status=='rejected') { return res.status(200).json({ "response_code": 400, "message": resp["connect-req-already-rejected"], "response" : null }); }
        req.temp_request = data
        next()
      }
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
    })
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function isConnected(req, res, next) {

  if (!req.temp_user.connected_users.includes(req.other_user._id.toString())) {
    return res.status(200).json({ "response_code": 400, "message": resp["not-con"], "response" : null });
  }
  next()
}

module.exports = {
  isSentableChecker,
  isRejectableChecker,
  isAcceptableChecker,
  isConnected
};