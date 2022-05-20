const express = require('express');
const router = express.Router();
const mongoose = require('../../services/mongo_db');
var os = require('os');

// OTP controller
const { cacheOTP, uncacheOTP } = require("./controllers/otp");

// Validator middleware
const { isPhone, isPhoneOTP } = require("./middlewares/validator");

// Database connectivity validator middleware
const { mongoDBping, mongoHealthCheck } = require("./middlewares/mongodb");
const { redisHealthCheck } = require("./middlewares/redis");

// OTP middleware
const { generateOTP, validateOTP } = require("./middlewares/otp");

// User middleware
const { createUserIfNotExist, validateUserExist, validateUserByID, maxDeviceCheck } = require("./middlewares/user");

// Token middleware
const { createTokens, verifyRefreshToken, refreshTokens, verifyAccessToken, uncacheToken } = require("./middlewares/token");

// Response
const { resp } = require("./data/response");

//Routes
router.post('/login/', isPhone, mongoDBping, createUserIfNotExist, async (req, res) => {
  try {

    const otp = generateOTP(6);
    cacheOTP(req, otp, res);

  } catch (err) {
    console.log(err);
    return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
  }
});

router.post('/validate/otp/', isPhoneOTP, mongoDBping, validateUserExist, validateOTP, maxDeviceCheck, createTokens, async (req, res) => {

  req.temp_user.save()
    .then(data => {
      uncacheOTP(req, res, data);
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
    })
});

router.get('/token/refresh/', verifyRefreshToken, mongoDBping, validateUserByID, refreshTokens, async (req, res) => {

  req.temp_user.save()
    .then(data => {
      return res.status(200).json({ "response_code": 200, "message": resp["token-generated-success"], "response" : { "accessToken": req.accesstoken, "refreshToken": req.refreshtoken } });
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
    })
});

router.get('/logout/', verifyAccessToken, mongoDBping, validateUserByID, uncacheToken, async (req, res) => {

  req.temp_user.save()
    .then(data => {
      return res.status(200).json({ "response_code": 200, "message": resp["logged-out-success"], "response" : null });
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
    })
})

router.get('/healthcheck', mongoHealthCheck, redisHealthCheck, async (req, res) => {

  return res.status(200).json({ "response_code": 200, "message": resp[200], "response" : { "database": req.mongodb, "database_code": req.code_mongodb, "cache_database": req.redis, "cache_database_code": req.code_redis, "version": "1.0", "hostname": os.hostname() } });
});

module.exports = router;