const express = require('express');
const router = express.Router();
const mongoose = require('../../services/mongo_db');
const request = require('../../models/connect_request');
const axios = require('axios');

// Validator middleware
const { idValidator, pageValidator } = require("./middlewares/validator");

// Database connectivity validator middleware
const { mongoDBping } = require("./middlewares/mongodb");

// User middleware
const { validateUserByID, validateOtherUserByID, validateNormalUser, validateOtherNormalUser } = require("./middlewares/user");

// Connect request middleware
const { isSentableChecker, isRejectableChecker, isAcceptableChecker, isConnected } = require("./middlewares/connect_request_validator");

// Token middleware
const { verifyAccessToken } = require("./middlewares/token");

// Response
const { resp } = require("./data/response");
const user = require('../../models/user');

//Routes
router.post('/status/', idValidator, verifyAccessToken, mongoDBping, validateUserByID, validateOtherUserByID, async (req, res) => {

  request.findOne({ requester: req.temp_user._id, receiver: req.other_user._id })
    .then(data => {
      if (data == null) { return res.status(200).json({ "response_code": 404, "message": resp["connect-req-not-found"], "response": null }); }
      return res.status(200).json({ "response_code": 200, "message": resp["connect-req-status-fetched"], "response": { data } });
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })

});

router.post('/sent/', idValidator, verifyAccessToken, mongoDBping, validateUserByID, validateNormalUser, validateOtherUserByID, isSentableChecker, validateOtherNormalUser, async (req, res) => {

  var new_request = new request({
    requester: req.temp_user._id,
    receiver: req.other_user._id
  })

  new_request.save()
    .then(data => {
      const new_send_data = {
        id: req.other_user._id.toString(),
        title: req.temp_user.name,
        body: 'New connect request received.',
        type: 'request',
        request_id: data.requester.toString()
      }
      axios.post('http://app.geekstudios.tech/contact/v1/push', new_send_data)
        .then((response) => {
          return res.status(200).json({ "response_code": 200, "message": resp["connect-req-sent"], "response": { data } });
        })
        .catch((error) => {
          console.log(error)
          return res.status(200).json({ "response_code": 200, "message": resp["connect-req-sent"], "response": { data } });
        })
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })

});

router.post('/reject/', idValidator, verifyAccessToken, mongoDBping, validateUserByID, validateOtherUserByID, isRejectableChecker, async (req, res) => {

  req.temp_request.status = 'rejected'
  req.temp_request.rejected_date = new Date()

  req.temp_request.save()
    .then(data => {
      const new_send_data = {
        id: req.other_user._id.toString(),
        title: req.other_user.name,
        body: 'Connect request rejected 😔.'
      }
      axios.post('http://app.geekstudios.tech/contact/v1/push', new_send_data)
        .then((response) => {
          return res.status(200).json({ "response_code": 200, "message": resp["connect-req-rejected"], "response": { data } });
        })
        .catch((error) => {
          console.log(error)
          return res.status(200).json({ "response_code": 200, "message": resp["connect-req-rejected"], "response": { data } });
        })

    });
})

router.post('/remove/', idValidator, verifyAccessToken, mongoDBping, validateUserByID, validateOtherUserByID, isConnected, async (req, res) => {

  let index_user = req.temp_user.blocked_users.indexOf(req.other_user._id.toString())
  let index_by = req.other_user.blocked_by.indexOf(req.temp_user._id.toString())

  req.temp_user.connected_users.splice(index_user, 1)
  req.temp_user.markModified('connected_users')
  req.other_user.connected_users.splice(index_by, 1)
  req.other_user.markModified('connected_users')

  const session = await mongoose.startSession()

  try {
    session.startTransaction();

    await req.temp_user.save()
    await req.other_user.save()

    await session.commitTransaction()
    req.done = true
  } catch (err) {
    console.log(err);
    await session.abortTransaction()
    req.done = false
  }

  session.endSession()

  if (req.done) { return res.status(200).json({ "response_code": 200, "message": resp["connect-req-removed"], "response": null }); }

  return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });

});

router.post('/accept/', idValidator, verifyAccessToken, mongoDBping, validateUserByID, validateOtherUserByID, isAcceptableChecker, async (req, res) => {

  req.temp_user.connected_users.push(req.other_user._id)
  req.temp_user.markModified('connected_users')
  req.other_user.connected_users.push(req.temp_user._id)
  req.other_user.markModified('connected_users')

  const session = await mongoose.startSession()

  try {
    session.startTransaction();

    await req.temp_user.save()
    await req.other_user.save()
    await req.temp_request.remove()

    await session.commitTransaction()
    req.done = true
  } catch (err) {
    console.log(err);
    await session.abortTransaction()
    req.done = false
  }

  session.endSession()

  if (req.done) {
    const new_send_data = {
      id: req.other_user._id.toString(),
      title: req.other_user.name,
      body: 'Connect request accepted 🥳.'
    }
    axios.post('http://app.geekstudios.tech/contact/v1/push', new_send_data)
      .then((response) => {
        return res.status(200).json({ "response_code": 200, "message": resp["connect-req-accepted"], "response": null });
      })
      .catch((error) => {
        console.log(error)
        return res.status(200).json({ "response_code": 200, "message": resp["connect-req-accepted"], "response": null });
      })
  }else{
    return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
  }

});

router.get('/get/', verifyAccessToken, mongoDBping, validateUserByID, pageValidator, async (req, res) => {

  request.find({ $or: [{ receiver: req.temp_user._id }, { requester: req.temp_user._id }] }, {}, { sort: '-request_date' })
    .limit(req.query.limit * 1)
    .skip((req.query.page - 1) * req.query.limit)
    .lean()
    .then(async (data) => {
      for (let i = 0; i < data.length; i++) {
        let temp_id
        if (data[i].requester == req.temp_user._id.toString()) {
          data[i].send_by_me = true
          temp_id = data[i].receiver
        } else {
          data[i].send_by_me = false
          temp_id = data[i].requester
        }
        await user.findById(mongoose.Types.ObjectId(temp_id))
          .then(user_data => {
            if (user_data != null) {
              if (data[i].send_by_me) {
                data[i].receiver = {}
                data[i].receiver._id = user_data._id
                data[i].receiver.name = user_data.name
                data[i].receiver.bio = user_data.bio
                data[i].receiver.profile_images = user_data.profile_images
                data[i].receiver.phone = user_data.phone
                data[i].receiver.country_code = user_data.country_code
              } else {
                data[i].requester = {}
                data[i].requester._id = user_data._id
                data[i].requester.name = user_data.name
                data[i].requester.bio = user_data.bio
                data[i].requester.profile_images = user_data.profile_images
                data[i].requester.phone = user_data.phone
                data[i].requester.country_code = user_data.country_code
              }
            } else {
              data[i] = undefined
            }
          })
          .catch(err => {
            console.log(err);
            return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
          })
      }
      if (data == null) { return res.status(200).json({ "response_code": 404, "message": resp["connect-req-not-found"], "response": null }); }
      return res.status(200).json({ "response_code": 200, "message": resp["connect-reqs-fetched"], "response": { "requests": data } });
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })

});

router.get('/get/all', verifyAccessToken, mongoDBping, validateUserByID, pageValidator, async (req, res) => {

  let arr = []
  data = req.temp_user.connected_users
  for (let i = 0; i < data.length; i++) {
    await user.findById(mongoose.Types.ObjectId(temp_id))
      .then(user_data => {
        arr.push(user_data)
      })
      .catch(err => {
        console.log(err);
        return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
      })
  }
  if (arr == null) { return res.status(200).json({ "response_code": 404, "message": resp[404], "response": null }); }
  return res.status(200).json({ "response_code": 200, "message": resp[200], "response": { "users": arr } });

});

module.exports = router;