const Ajv = require("ajv")
const addFormats = require("ajv-formats")
const ajv = new Ajv({verbose: true})
addFormats(ajv)

// Response
const { resp } = require("../data/response");

// Validate id & count
const schemaIdCountValidate = {
  type: "object",
  properties: {
    id: { type: "string", maxLength: 24, minLength: 24 },
    count: { type: "number" }
  },
  required: ["id"],
  additionalProperties: false
}

const idCountValidate = ajv.compile(schemaIdCountValidate)

function idCountValidator(req, res, next) {
  const valid = idCountValidate(req.body)
  if (!valid) {
    return res.status(200).json({ "response_code": 400, "message": resp[400], "response" : null })
  } else {
    next();
  }
}

// Validate id
const schemaIdValidate = {
  type: "object",
  properties: {
    id: { type: "string", maxLength: 24, minLength: 24 }
  },
  required: ["id"],
  additionalProperties: false
}

const idValidate = ajv.compile(schemaIdValidate)

function idValidator(req, res, next) {
  const valid = idValidate(req.body)
  if (!valid) {
    return res.status(200).json({ "response_code": 400, "message": resp[400], "response" : null })
  } else {
    next();
  }
}

// Validate username
const schemaUsernameValidate = {
  type: "object",
  properties: {
    username: { type: "string", maxLength: 50, minLength: 2 }
  },
  required: ["username"],
  additionalProperties: false
}

const usernameValidate = ajv.compile(schemaUsernameValidate)

function usernameValidator(req, res, next) {
  const valid = usernameValidate(req.body)
  if (!valid) {
    return res.status(200).json({ "response_code": 400, "message": resp[400], "response" : null })
  } else {
    next();
  }
}

// Validate update
const schemaUpdateValidate = {
  type: "object",
  properties: {
    name: { type: "string", maxLength: 150, minLength: 2 },
    dob: { type: "string", format: "date" },
    lat: { type: "number" },
    lon: { type: "number" },
    bio: { type: "string", maxLength: 500, minLength: 2 },
    gender: { enum : ['male','female','others'] },
    handicap_type: { enum : ['deaf','dumb','blind','others'] },
    guardian_phone: { type: "string", maxLength: 10, minLength: 10 }
  },
  required: ["name", "dob","lat","lon","bio","gender","handicap_type","guardian_phone"],
  additionalProperties: false
}

const updateValidate = ajv.compile(schemaUpdateValidate)

function validateProfileUpdate(req, res, next) {
  const valid = updateValidate(req.body)
  if (!valid) {
    return res.status(200).json({ "response_code": 400, "message": updateValidate.errors, "response" : null })
  } else {
    if(req.body.gender != 'male' && req.body.gender != 'female'){
      return res.status(200).json({ "response_code": 402, "message": resp[400], "response" : null })
    }
    let lat = req.body.lat
    let lon = req.body.lon
    if(!(lat>=-90.0 && lat<=90.0 && lon>=-180.0 && lon<=180.0)){
      return res.status(200).json({ "response_code": 403, "message": resp[400], "response" : null })
    }
    next();
  }
}

// Validate guardian update
const schemaGuardianUpdateValidate = {
  type: "object",
  properties: {
    name: { type: "string", maxLength: 150, minLength: 2 },
    lat: { type: "number" },
    lon: { type: "number" }
  },
  required: ["name"],
  additionalProperties: false
}

const updateGuardianValidate = ajv.compile(schemaGuardianUpdateValidate)

function validateGuardianProfileUpdate(req, res, next) {
  const valid = updateGuardianValidate(req.body)
  if (!valid) {
    return res.status(200).json({ "response_code": 400, "message": updateGuardianValidate.errors, "response" : null })
  } else {
    let lat = req.body.lat
    let lon = req.body.lon
    if(!(lat>=-90.0 && lat<=90.0 && lon>=-180.0 && lon<=180.0)){
      return res.status(200).json({ "response_code": 403, "message": resp[400], "response" : null })
    }
    next();
  }
}

function pageValidator(req, res, next){
  if (typeof req.query.limit == 'undefined') {
    req.query.limit = 10
  }else{
    if(!Number.isInteger(parseInt(req.query.limit))){
      return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null });
    }else if(req.query.limit<1){
      return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null });
    }
  }

  if (typeof req.query.page == 'undefined') {
    req.query.page = 1
  }else{
    if(!Number.isInteger(parseInt(req.query.page))){
      return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null });
    }else if(req.query.page<1){
      return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null });
    }
  }

  next()
}

module.exports = {
  idValidator,
  validateProfileUpdate,
  pageValidator,
  usernameValidator,
  idCountValidator,
  validateGuardianProfileUpdate
};