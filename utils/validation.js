const {validator} = require('express-validator')

const validateSignup = [
    body("fname")
      .trim()
      .notEmpty()
      .withMessage("First name is required")
      .isAlpha()
      .withMessage("First name must contain only letters")
      .isLength({ min: 2 })
      .withMessage("First name should be atleast 2 charactors long"),
    body("lname")
      .trim()
      .notEmpty()
      .withMessage("Last name is required")
      .isAlpha()
      .withMessage("Last name must contain only letters")
      .isLength({ min: 2 })
      .withMessage("Last name should be atleast 2 charactors long"),
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail()
      .toLowerCase(),
    body("phone")
      .isNumeric()
      .isLength({ min: 10 })
      .withMessage("Enter a valid 10-digit mobile number"),
    body("password")
      .trim()
      .isLength(5)              
      .withMessage("password must be at least 5 charactors Long"),
  ]
  

module.exports = {validateSignup}