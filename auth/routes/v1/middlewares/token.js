const jwt = require('jsonwebtoken');
require('dotenv').config();
const redis = require('../../../services/redis_db');

// Response
const { resp } = require("../data/response");

function cacheToken(req, res) {

  if (redis.IsReady) {
    redis.set(req.temp_user._id + '-'+ req.dev_id + '-token', req.accesstoken, 'ex', 86400)
      .then((reply) => {
        return true;
      })
      .catch(error => {
        console.log(error);
        return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
      })
  } else {
    console.log("Redis not connected error");
    return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
  }
}

function uncacheToken(req, res, next) {

  if (redis.IsReady) {
    redis.del(req.temp_user._id + '-'+ req.token.device_id + '-token')
      .then((reply) => {
        var found = false;
        var pos = -1;
        if (req.temp_user.device) {
          req.temp_user.device.forEach((element, index) => {
            if(element.fcm==req.token.device_id){
              found = true;
              pos = index;
            }
          });
          if(!found){ return res.status(200).json({ "response_code": 401, "message": resp["invalid-token"], "response" : null }); }
          else{
            req.temp_user.device.splice(pos, 1);
          }
        }
        req.temp_user.updation_ip = req.ip;
        req.temp_user.markModified('device')
        next();
      })
      .catch(error => {
        console.log(error);
        return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
      })
  } else {
    console.log("Redis not connected error");
    return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
  }
}

function createTokens(req, res, next) {

  try {

    const accessToken = jwt.sign({ id: req.temp_user._id, device_id: req.body.device.fcm }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' })
    const refreshToken = jwt.sign({ id: req.temp_user._id, device_id: req.body.device.fcm, lastRefreshed: Date.now() }, process.env.REFRESH_TOKEN_SECRET)
    var found = false;
    var pos = -1;
    if (req.temp_user.device) {
      req.temp_user.device.forEach((element, index) => {
        if(element.fcm==req.body.device.fcm){
          found = true;
          pos = index;
        }
      });
      if(found){ req.temp_user.device.splice(pos, 1); }
    }
    let temp_dev = {}
    for (let [key, value] of Object.entries(req.body.device)) {
      temp_dev[key] = value
    }
    temp_dev.token = refreshToken
    temp_dev.last_login = new Date().toISOString()
    temp_dev.login_ip = req.ip
    req.temp_user.device.push(temp_dev)
    req.accesstoken = accessToken
    req.refreshtoken = refreshToken
    req.temp_user.updation_ip = req.ip
    req.dev_id = req.body.device.fcm
    cacheToken(req, res)
    req.temp_user.markModified('device')
    next();

  } catch (err) {
    console.log(err);
    return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
  }
}

function refreshTokens(req, res, next) {

  try {

    const accessToken = jwt.sign({ id: req.temp_user._id, device_id: req.token.device_id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' })
    const refreshToken = jwt.sign({ id: req.temp_user._id, device_id: req.token.device_id, lastRefreshed: Date.now() }, process.env.REFRESH_TOKEN_SECRET)
    var found = false;
    var pos = -1;
    if (req.temp_user.device) {
      req.temp_user.device.forEach((element, index) => {
        if(element.fcm==req.token.device_id){
          found = true;
          pos = index;
        }
      });
      if(!found){ return res.status(200).json({ "response_code": 401, "message": resp["invalid-token"], "response" : null }); }
      else {
        if(req.temp_user.device[pos].token!=req.oldtoken){
          return res.status(200).json({ "response_code": 401, "message": resp["invalid-token"], "response" : null });
        }
      }
    }
    req.temp_user.device[pos].token = refreshToken
    req.temp_user.device[pos].last_login = new Date().toISOString()
    req.temp_user.device[pos].login_ip = req.ip
    req.accesstoken = accessToken
    req.refreshtoken = refreshToken
    req.temp_user.updation_ip = req.ip
    req.dev_id = req.token.device_id
    cacheToken(req, res)
    req.temp_user.markModified('device')
    next();

  } catch (err) {
    console.log(err);
    return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
  }
}

function dateDifference(d1, d2) {

  const date1 = new Date(d1);
  const date2 = new Date(d2);
  const diffTime = Math.abs(date2 - date1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function verifyRefreshToken(req, res, next) {

  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  req.oldtoken = token;
  if (token == null) return res.status(200).json({ "response_code": 403, "message": resp[403], "response" : null })

  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(200).json({ "response_code": 401, "message": resp["invalid-token"], "response" : null })
    if (dateDifference(Date.now(), token.lastRefreshed) > 30) return res.status(200).json({ "response_code": 401, "message": resp["expired-token"], "response" : null })
    req.token = user
    next()
  })
}

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
  createTokens,
  verifyRefreshToken,
  refreshTokens,
  verifyAccessToken,
  uncacheToken
};