const redis = require('../../../services/redis_db');
const https = require('https');

// Response
const { resp } = require("../data/response");

function sendOTP(name, phone, otp) {
  return new Promise((resolve, reject) => {
  https.get('https://www.fast2sms.com/dev/bulkV2?authorization=sBuCdzQk5HDoWFYjAMnp1ihx4JlPqUIyevwKb823Tfc06t9OXrabYpqC8ZuJ439KhXvf5WcFN7AtVGdB&route=dlt&sender_id=GEEKST&message=140190&variables_values=' + name + '%7C' + otp + '%7C&flash=0&numbers=' + phone, (resp) => {
    let data = '';

    // A chunk of data has been received.
    resp.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      let js = JSON.parse(data)
      if (js.return) {
        resolve(true)
      } else {
        resolve(false)
      }
    });

  }).on("error", (err) => {
    console.log(err);
    resolve(false)
  });
})
}

function cacheOTP(req, otp, res) {
  if (redis.IsReady) {
    var left;
    redis.get(req.body.phone + '-limit')
      .then((reply) => {
        if (reply == null) {
          redis.set(req.body.phone + '-limit', 100, 'ex', 3600) //PUT 3 AS LIMIT IN PROD
            .then((reply) => {
              redis.set(req.body.phone + '-otp', otp, 'ex', 180)
                .then(async (reply) => {
                  let otpsend = await sendOTP('User', req.body.phone, otp)
                  if (otpsend) {
                    return res.status(200).json({ "response_code": 200, "message": resp["otp-generated-success"], "response": { "otp" : otp } });
                  } else {
                    return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
                  }
                })
                .catch(error => {
                  console.log(error);
                  return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
                });
            })
            .catch(error => {
              console.log(error);
              return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
            });
        } else if (reply > 0) {
          redis.decr(req.body.phone + '-limit')
            .then((reply) => {
              redis.set(req.body.phone + '-otp', otp, 'ex', 180)
                .then(async (reply) => {
                  let otpsend = await sendOTP('User', req.body.phone, otp)
                  if (otpsend) {
                    return res.status(200).json({ "response_code": 200, "message": resp["otp-generated-success"], "response": { "otp" : otp } });
                  } else {
                    redis.incr(req.body.phone + '-limit')
                      .then(data => {
                        return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
                      })
                      .catch(err => {
                        console.log(err);
                        return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
                      })
                  }
                })
                .catch(error => {
                  console.log(error);
                  return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
                });
            })
            .catch(error => {
              console.log(error);
              return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
            });
        } else {
          redis.ttl(req.body.phone + '-limit')
            .then((reply) => {
              var ttl = parseInt(parseInt(reply) / 60);
              return res.status(200).json({ "response_code": 429, "message": "Max OTP Limit reached. Try after " + ttl + "mnts.", "response": null });
            })
            .catch(error => {
              console.log(error);
              return res.status(200).json({ "response_code": 429, "message": resp["max-otp-reached"], "response": null });
            });
        }
      })
      .catch(error => {
        console.log(error);
        return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
      });
  } else {
    console.log("Redis not connected error");
    return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
  }
}

async function uncacheOTP(req, res, data) {
  if (redis.IsReady) {
    redis.del(req.body.phone + '-otp')
      .then((reply) => {
        data.device = undefined;
        return res.status(200).json({ "response_code": 200, "message": resp["logged-in-success"], "response": { "user": data, "accessToken": req.accesstoken, "refreshToken": req.refreshtoken } });
      })
      .catch(error => {
        console.log(error);
        return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
      })
  } else {
    console.log("Redis not connected error");
    return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
  }
}

module.exports = {
  cacheOTP,
  uncacheOTP
};