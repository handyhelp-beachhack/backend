const mongoose = require('../../../services/mongo_db');
const user = require('../../../models/user');

// Response
const { resp } = require("../data/response");

function validateUserByID(req, res, next) {

  user.findById(mongoose.Types.ObjectId(req.body.id))
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

function validateUserByIDToken(req, res, next) {

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

module.exports = {
  validateUserByID,
  validateUserByIDToken
};