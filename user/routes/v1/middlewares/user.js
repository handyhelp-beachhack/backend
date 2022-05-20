const mongoose = require('../../../services/mongo_db');
const user = require('../../../models/user');

// Response
const { resp } = require("../data/response");

function validateUserByID(req, res, next) {

  user.findById(req.token.id)
    .then(data => {
      if (data == null) {
        return res.status(200).json({ "response_code": 404, "message": resp["account-not-found"], "response": null });
      } else {
        req.temp_user = data;
        next();
      }
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

function validateOtherUserByID(req, res, next) {

  user.findById(req.body.id)
    .then(data => {
      if (data == null) {
        return res.status(200).json({ "response_code": 404, "message": resp["account-not-found"], "response": null });
      } else {
        if (data._id.toString() == req.temp_user._id.toString()) { return res.status(200).json({ "response_code": 404, "message": resp["req-rec-should-not-same"], "response": null }); }
        req.other_user = data;
        next();
      }
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

function validateNormalUser(req, res, next) {

  if (req.temp_user.account_type == 'user') {
    next()
  } else {
    return res.status(200).json({ "response_code": 400, "message": 'You are not a normal user.', "response": null });
  }

}

function validateGuardianUser(req, res, next) {

  if (req.temp_user.account_type == 'guardian') {
    next()
  } else {
    return res.status(200).json({ "response_code": 400, "message": 'You are not a guardian user.', "response": null });
  }

}

function validateCompanyUser(req, res, next) {

  if (req.temp_user.account_type == 'company') {
    next()
  } else {
    return res.status(200).json({ "response_code": 400, "message": 'You are not a company user.', "response": null });
  }

}

function validateOtherNormalUser(req, res, next) {

  if (req.other_user.account_type == 'user') {
    next()
  } else {
    return res.status(200).json({ "response_code": 400, "message": 'The other person is not a normal user.', "response": null });
  }

}

function validateOtherGuardianUser(req, res, next) {

  if (req.other_user.account_type == 'guardian') {
    next()
  } else {
    return res.status(200).json({ "response_code": 400, "message": 'The other person is not a guardian user.', "response": null });
  }

}

function formatUserViewData(req, res, next) {

  req.other_user.phone = undefined;
  req.other_user.device = undefined;
  req.other_user.creation_ip = undefined;
  req.other_user.updation_ip = undefined;
  req.other_user.__v = undefined;
  req.other_user.created_at = undefined;
  req.other_user.updated_at = undefined;

  next();

}

async function formatSameUserViewData(req, res, next) {

  req.temp_user.device = undefined;
  req.temp_user.creation_ip = undefined;
  req.temp_user.updation_ip = undefined;
  req.temp_user.__v = undefined;
  req.temp_user.created_at = undefined;
  req.temp_user.updated_at = undefined;

  if(req.temp_user.account_type == 'guardian'){
    let obj = {}
    obj.connect_requests = req.temp_user.pending_guradian_connection
    obj.phone = req.temp_user.phone
    obj._id = req.temp_user._id
    const con_u = await user.find({ _id: { $in : req.temp_user.connected_users }})
    obj.connected = con_u
    req.temp_user = obj
  }

  next();

}

function formatSameUserViewDataFunc(data) {

  data.device = undefined;
  data.creation_ip = undefined;
  data.updation_ip = undefined;
  data.__v = undefined;
  data.created_at = undefined;
  data.updated_at = undefined;

  return data

}

async function processUpdateData(req, res, next) {

  req.old_profile_completion = req.temp_user.profile_completion

  for (let [key, value] of Object.entries(req.body)) {
    if (key == 'lat' || key == 'lon') {
      req.temp_user.location.coordinates = [req.body.lon, req.body.lat]
    } else if (key == 'guardian_phone' && !req.temp_user.guardian.status) {
      req.temp_user.guardian.phone = value
      req.temp_user.guardian.status = "pending"
    } else {
      req.temp_user[key] = value
    }
  }

  req.temp_user.profile_completion = 1

  return next();

}

function createUserIfNotExist(req, res) {

  return new Promise((resolve, reject) => {
  user.findOne({ phone: req.body.guardian_phone })
    .then(data => {
      if (data == null) {
        var usernew = new user({
          phone: req.body.guardian_phone,
          account_type: 'guardian',
          creation_ip: req.ip,
          location: {
            coordinates : [76.2673041, 9.9312328]
          }
        })
        usernew.save()
          .then(data => {
            resolve(data)
          })
          .catch(err => {
            if (err.name == 'ValidationError') {
              console.log(err)
              return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null });
            } else {
              console.log(err);
              return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
            }
          })
      } else {
        resolve(data)
      }
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
  })
}

async function sendGuardianConnectRequest(req, res, next) {

  req.guardian = await createUserIfNotExist(req, res)
  req.guardian.pending_guradian_connection = (req.guardian.pending_guradian_connection) ? req.guardian.pending_guradian_connection.filter((item) => item.phone !== req.temp_user.phone) : []
  let obj = {}
  obj.name = req.temp_user.name
  obj.id = req.temp_user._id
  obj.phone = req.temp_user.phone
  req.guardian.pending_guradian_connection.push(obj)
  req.guardian.save()
    .then(data => {
      next()
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })

}

function guardianConnect(req, res, next){
  if(req.temp_user.profile_completion == 0){
    return res.status(200).json({ "response_code": 400, "message": 'Profile not completed.', "response": null });
  }

  if(req.temp_user.pending_guradian_connection.some(person => person.id.toString() === req.other_user._id.toString())){
    req.other_user.guardian.status = 'connected'
    req.other_user.guardian.id = req.temp_user._id
    req.temp_user.connected_users.push(req.other_user._id)
    req.temp_user.pending_guradian_connection = req.temp_user.pending_guradian_connection.filter((item) => item.phone !== req.other_user.phone)
    next()
  }else{
    return res.status(200).json({ "response_code": 400, "message": 'Connect req not found.', "response": null });
  }
}

function guardianPermissionChecker(req, res, next){

  if(req.temp_user.connected_users.includes(req.other_user._id)){
    next()
  }else{
    return res.status(200).json({ "response_code": 400, "message": 'Unauthorized access, you are not connected with the user.', "response": null });
  }
}

module.exports = {
  validateUserByID,
  validateOtherUserByID,
  formatUserViewData,
  processUpdateData,
  formatSameUserViewData,
  formatSameUserViewDataFunc,
  sendGuardianConnectRequest,
  validateNormalUser,
  validateGuardianUser,
  validateOtherNormalUser,
  validateOtherGuardianUser,
  guardianConnect,
  guardianPermissionChecker,
  validateCompanyUser

};