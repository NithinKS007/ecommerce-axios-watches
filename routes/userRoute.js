const express = require('express');

const userRoute = express.Router()

const userController = require('../controllers/userController')


//loaging the registration page
userRoute.get("/signup",userController.loadRegister)
//generating the otp for registration
userRoute.post("/signup",userController.generateOtp)
//loading the otp verificaton page after sending the otp
userRoute.get("/verify-otp",userController.otpVPage)
//loading the home page after registering
userRoute.post("/home",userController.verifyOtp)


userRoute.get("/signin",userController.loadsignin)






module.exports = userRoute  
