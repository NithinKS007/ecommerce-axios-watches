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

//from here redirecting to home page if otp is correct
userRoute.post("/verify-otp",userController.verifyOtp)



//resend otp route
userRoute.get("/resend-otp",userController.resendOtp)


//loading the home page after verifying the otp after reg or using signin form
userRoute.get("/home",userController.loadHome)




//loading the signin page
userRoute.get("/signin",userController.loadsignin)

//verifying the user in the signin page
userRoute.post("/signin",userController.verifySignin)



//registering with google
userRoute.get("/auth/google",passport.authenticate('google',{scope:['email','profile']}))

userRoute.get("/google/callback",passport.authenticate('google',{successRedirect:"/home",failureRedirect:"/signup"}))



//loading all the pages mens,womens,kids
userRoute.get("/showcase",userController.loadShowCase)


//loading the product details page
userRoute.get("/product-details",userController.loadProductDetails)

module.exports = userRoute  
