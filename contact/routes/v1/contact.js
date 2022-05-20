const express = require('express');
const router = express.Router();
const mongoose = require('../../services/mongo_db');
var os = require('os');
require('dotenv').config();
var axios = require('axios');

// Token middleware
const { verifyAccessToken } = require("./middlewares/token");

// Database connectivity validator middleware
const { mongoDBping, mongoHealthCheck } = require("./middlewares/mongodb");
const { redisHealthCheck } = require("./middlewares/redis");

// User middleware
const { validateUserByID, validateUserByIDToken } = require("./middlewares/user");

// Uploader middleware
const { validatePushBody } = require("./middlewares/validator");

// Response
const { resp } = require("./data/response");

//Routes

router.post('/push', validatePushBody, mongoDBping, validateUserByID, async (req, res) => {

  req.temp_user.notifications.push({ title: req.body.title, body: req.body.body, type: (req.body.type) ? req.body.type : null, request_id: (req.body.request_id) ? req.body.request_id : null })

  req.temp_user.markModified('notifications')
  req.temp_user.save()
    .catch(err => {
      console.log(err)
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })

  let fcms = []
  req.temp_user.device.forEach(element => {
    fcms.push(element.fcm)
  });

  const uri = "https://fcm.googleapis.com/fcm/send";

  const headers = {
    "Content-Type": "application/json",
    "Authorization": "key=" + process.env.FIREBASE_TOKEN
  }

  const data = {
    notification: {
      title: req.body.title,
      body: req.body.body
    },
    registration_ids: fcms,
    priority: 'high'
  }

  axios.post(uri, data, {
    headers: headers
  })
    .then((response) => {
      console.log(response.data.results)
      return res.status(200).json({ "response_code": 200, "message": resp[200], "response": null });
    })
    .catch((error) => {
      console.log(error)
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })

});

router.get('/get', verifyAccessToken, mongoDBping, validateUserByIDToken, async (req, res) => {

  return res.status(200).json({ "response_code": 200, "message": resp[200], "response": { "notifications": req.temp_user.notifications } });
});

router.get('/healthcheck', mongoHealthCheck, redisHealthCheck, async (req, res) => {

  return res.status(200).json({ "response_code": 200, "message": resp[200], "response": { "database": req.mongodb, "database_code": req.code_mongodb, "cache_database": req.redis, "cache_database_code": req.code_redis, "version": "1.0", "hostname": os.hostname() } });
});

module.exports = router;