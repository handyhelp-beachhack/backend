const mongoose = require('../../../services/mongo_db');
const user = require('../../../models/user');

// Response
const { resp } = require("../data/response");

function createUserIfNotExist(req, res, next) {

  user.findOne({ phone: req.body.phone })
    .then(data => {
      if (data == null) {
        var usernew = new user({
          phone: req.body.phone,
          country_code: req.body.country_code,
          account_type: req.body.account_type,
          creation_ip: req.ip
        })
        usernew.save()
          .then(data => {
            next();
          })
          .catch(err => {
            if (err.name == 'ValidationError') {
              return res.status(200).json({ "response_code": 400, "message": resp[400], "response" : null });
            } else {
              console.log(err);
              return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
            }
          })
      } else {
        next();
      }
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
    })
}

function validateUserExist(req, res, next) {

  user.findOne({ phone: req.body.phone })
    .then(data => {
      if (data == null) {
        return res.status(200).json({ "response_code": 404, "message": resp["account-not-found"], "response" : null });
      } else {
        req.temp_user = data;
        next();
      }
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
    })
}

function validateUserByID(req, res, next) {

  user.findById(req.token.id)
    .then(data => {
      if (data == null) {
        return res.status(200).json({ "response_code": 404, "message": resp["account-not-found"], "response" : null });
      } else {
        req.temp_user = data;
        next();
      }
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
    })
}

function maxDeviceCheck(req, res, next) {

  if(req.temp_user.device.length >= 5){
    return res.status(200).json({ "response_code": 400, "message": resp["max-device-reached"], "response" : null });
  }
  next();
}

module.exports = {
  createUserIfNotExist,
  validateUserExist,
  validateUserByID,
  maxDeviceCheck
};