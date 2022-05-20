const Ajv = require("ajv")
const ajv = new Ajv()

// Response
const { resp } = require("../data/response");

// Validate Add Image
const schemaPush = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 24, maxLength: 24 },
    body: { type: "string", minLength: 2, maxLength: 500 },
    title: { type: "string", minLength: 2, maxLength: 100 },
    type: { type: "string", minLength: 2, maxLength: 100 },
    request_id: { type: "string", minLength: 24, maxLength: 24 }
  },
  required: ["id","body","title"],
  additionalProperties: false
}

const push = ajv.compile(schemaPush)

function validatePushBody(req, res, next) {
  const valid = push(req.body)
  if (!valid) {
    return res.status(200).json({ "response_code": 400, "message": resp[400], "response" : null })
  } else {
    next();
  }
}

module.exports = {
  validatePushBody
};