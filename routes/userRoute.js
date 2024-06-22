const express = require('express');

const userRoute = express.Router()

const userController = require('../controllers/userController');

//requring passport for registering in google
const passport = require('passport')


//loading the home page before registering
userRoute.get("/",userController.loadHome)
//loaging the registration page
userRoute.get("/signup",userController.loadRegister)
//generating the otp for registration
userRoute.post("/signup",userController.generateOtp)
//loading the otp verificaton page after sending the otp
userRoute.get("/verify-otp",userController.otpVPage)
//loading the home page after registering
userRoute.post("/home",userController.verifyOtp)

//loading the signin page
userRoute.get("/signin",userController.loadsignin)

//loading the home page after signin
userRoute.post("/signin",userController.loadHome)

//registering with google
userRoute.get("/auth/google",passport.authenticate('google',{scope:['email','profile']}))

userRoute.get("/google/callback",passport.authenticate('google',{successRedirect:"/",failureRedirect:"/signup"}))

module.exports = userRoute  
