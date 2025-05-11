require("dotenv").config();
const session = require("express-session");

const sessionConfig = session({
  secret: process.env.secretkey,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
});

module.exports = sessionConfig;
