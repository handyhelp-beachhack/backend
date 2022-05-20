require('dotenv').config();
process.env.TZ = 'Asia/Calcutta'
const express = require('express');
const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.set('trust proxy', 1);

const pushRoute = require('./routes/v1/contact');
app.use('/v1', pushRoute);

const server = app.listen(
  PORT,
  () => console.log(`Contact service is running on port : ${PORT}`)
)