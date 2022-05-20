const express = require('express');
const router = express.Router();
var events = require("../../models/event");
const mongoose = require('../../services/mongo_db');
const axios = require('axios');

// Validator middleware
const { idValidator, validateEventUpdate } = require("./middlewares/validator");

// Database connectivity validator middleware
const { mongoDBping } = require("./middlewares/mongodb");

// User middleware
const { validateUserByID, validateCompanyUser } = require("./middlewares/user");

// Token middleware
const { verifyAccessToken } = require("./middlewares/token");

// Response
const { resp } = require("./data/response");

//Routes
router.post('/add', verifyAccessToken, validateEventUpdate, mongoDBping, validateUserByID, validateCompanyUser, async (req, res) => {

  var event = new events()

  for (let [key, value] of Object.entries(req.body)) {
    if (key == 'lat' || key == 'lon') {
      event.location.coordinates = [req.body.lon, req.body.lat]
    } else {
      event[key] = value
    }
  }

  event.posted_by = req.temp_user._id

  event.save()
    .then(data => {
      return res.status(200).json({ "response_code": 200, "message": 'Event posted successfuly.', "response": { "event": data } });
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
});

router.post('/delete', verifyAccessToken, idValidator, mongoDBping, validateUserByID, validateCompanyUser, async (req, res) => {

  events.findById(req.body.id)
    .then(data => {
      if (data == null) {
        return res.status(200).json({ "response_code": 400, "message": 'Event not found.', "response": null });
      }

      if (data.posted_by.toString() != req.temp_user._id.toString()) {
        return res.status(200).json({ "response_code": 400, "message": 'Event not posted by you.', "response": null });
      }

      data.remove()
        .then(data => {
          return res.status(200).json({ "response_code": 200, "message": 'Event deleted successfully.', "response": null });
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

router.get('/get/:id', verifyAccessToken, mongoDBping, validateUserByID, async (req, res) => {

  if (!Number.isInteger(parseInt(req.params.id))) {
    return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null });
  } else {
    req.km = parseInt(req.params.id)
    if (req.km > 600 || req.km <= 0) {
      return res.status(200).json({ "response_code": 400, "message": resp["distance-error"], "response": null });
    }
  }

  events.find({ location: { $near: { $geometry: { type: "Point", coordinates: req.temp_user.location.coordinates }, $maxDistance: parseInt(req.km) } } })
  .sort({created_at:1 })
    .then(data => {
      return res.status(200).json({ "response_code": 200, "message": 'Events fetched.', "response": { "events" : data } });
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
});

router.get('/get/posted', verifyAccessToken, mongoDBping, validateUserByID, async (req, res) => {

  events.find({ posted_by: req.temp_user._id })
    .then(data => {
      return res.status(200).json({ "response_code": 200, "message": 'Events fetched.', "response": { "events" : data } });
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
});

module.exports = router;