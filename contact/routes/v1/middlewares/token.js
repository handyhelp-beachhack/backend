const jwt = require('jsonwebtoken');
const redis = require('../../../services/redis_db');
require('dotenv').config();

// Response
const { resp } = require("../data/response");

function verifyAccessToken(req, res, next) {

  if (redis.IsReady) {

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.status(200).json({ "response_code": 403, "message": resp[403], "response" : null })

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) return res.status(200).json({ "response_code": 401, "message": resp["invalid-token"], "response" : null })
      redis.get(user.id + '-'+ user.device_id + '-token')
        .then((data) => {

          if (data != null && data == token) {
            req.token = user
            next()
          } else {
            return res.status(200).json({ "response_code": 401, "message": resp["expired-token"], "response" : null })
          }

        })
        .catch(error => {
          console.log(error);
          return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
        })
    })

  } else {
    console.log("Redis not connected error");
    return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
  }
}

module.exports = {
  verifyAccessToken
};