const redis = require('../../../services/redis_db');

// Response
const { resp } = require("../data/response");

function generateOTP(n) {
  var add = 1, max = 12 - add;

  if (n > max) {
    return generate(max) + generate(n - max);
  }

  max = Math.pow(10, n + add);
  var min = max / 10; // Math.pow(10, n) basically
  var number = Math.floor(Math.random() * (max - min + 1)) + min;

  return ("" + number).substring(add);
}

function validateOTP(req, res, next) {
  if (redis.IsReady) {
    redis.get(req.body.phone + '-otp', (err, reply) => {
      if (err) {
        console.log(err);
        return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null })
      } else {
        if (parseInt(reply) == req.body.otp) {
          next();
        } else {
          return res.status(200).json({ "response_code": 401, "message": resp["invalid-otp"], "response" : null });
        }
      }
    });
  } else {
    console.log("Redis not connected error");
    return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
  }
}

module.exports = {
  generateOTP,
  validateOTP
};