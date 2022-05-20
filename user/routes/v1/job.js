const express = require('express');
const router = express.Router();
var jobs = require("../../models/job");
const mongoose = require('../../services/mongo_db');
const axios = require('axios');

// Validator middleware
const { idValidator, validatejobUpdate } = require("./middlewares/validator");

// Database connectivity validator middleware
const { mongoDBping } = require("./middlewares/mongodb");

// User middleware
const { validateUserByID, validateCompanyUser } = require("./middlewares/user");

// Token middleware
const { verifyAccessToken } = require("./middlewares/token");

// Response
const { resp } = require("./data/response");

//Routes
router.post('/add', verifyAccessToken, validatejobUpdate, mongoDBping, validateUserByID, validateCompanyUser, async (req, res) => {

  var job = new jobs()

  for (let [key, value] of Object.entries(req.body)) {
    job[key] = value
  }

  job.posted_by = req.temp_user._id

  job.save()
    .then(data => {
      return res.status(200).json({ "response_code": 200, "message": 'Job posted successfuly.', "response": { "job": data } });
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
});

router.post('/delete', verifyAccessToken, idValidator, mongoDBping, validateUserByID, validateCompanyUser, async (req, res) => {

  jobs.findById(req.body.id)
    .then(data => {
      if (data == null) {
        return res.status(200).json({ "response_code": 400, "message": 'Job not found.', "response": null });
      }

      if (data.posted_by.toString() != req.temp_user._id.toString()) {
        return res.status(200).json({ "response_code": 400, "message": 'Job not posted by you.', "response": null });
      }

      data.remove()
        .then(data => {
          return res.status(200).json({ "response_code": 200, "message": 'Job deleted successfully.', "response": null });
        })
        .catch(err => {
          console.log(err);
          return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
        })
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
});

router.get('/get', verifyAccessToken, mongoDBping, validateUserByID, async (req, res) => {


  jobs.find({})
    .sort({ created_at: 1 })
    .then(data => {
      return res.status(200).json({ "response_code": 200, "message": 'Jobs fetched.', "response": { "jobs": data } });
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
});

router.get('/get/posted', verifyAccessToken, mongoDBping, validateUserByID, async (req, res) => {

  jobs.find({ posted_by: req.temp_user._id })
    .then(data => {
      return res.status(200).json({ "response_code": 200, "message": 'Jobs fetched.', "response": { "jobs": data } });
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
});

module.exports = router;