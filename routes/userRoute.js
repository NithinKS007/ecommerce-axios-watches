const express = require('express');

const userRoute = express.Router()

const userController = require('../controllers/userController')



userRoute.get("/signup",userController.loadRegister)
userRoute.post("/signup",userController.generateOtp)
userRoute.post("/signup/verify-otp",userController.verifyOtp)


// userRoute.get("/signin",userController.loadsignin)
module.exports = userRoute  
