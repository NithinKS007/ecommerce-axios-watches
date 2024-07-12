const express = require('express');

const userRoute = express.Router()

const userController = require('../controllers/userController');

//requiring no cache middleware
const cacheController = require('../middleware/cacheControl')

const userAuth = require('../middleware/userAuth')

//requring passport for registering in google
const passport = require('passport');

const handleReqBody = require('../middleware/handleReqBody')

//loading the home page before registering
userRoute.get("/",userController.loadHome)


//loaging the registration page
userRoute.get("/signup",userController.loadRegister)
//generating the otp for registration
userRoute.post("/signup",userController.generateOtp)

//loading the otp verificaton page after sending the otp
userRoute.get("/verifyOtp",userController.otpVPage)

//from here redirecting to home page if otp is correct
userRoute.post("/verifyOtp",userController.verifyOtp)

//resend otp route
userRoute.get("/resendOtp",userController.resendOtp)

//loading the home page after verifying the otp after reg or using signin form
userRoute.get("/home",userAuth.isUserLogin,userController.loadHome)




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
userRoute.get("/productDetails",userController.loadProductDetails)

//product adding to the cart from the product details page
userRoute.post("/productDetails",userController.addToCart)






//user loggout route
userRoute.get("/signout",userController.loadUserLogout)

//loading user profile
userRoute.get("/profile",userAuth.isUserLogin,userController.loadUserProfile)

//loading cart page
userRoute.get("/cart",userAuth.isUserLogin,userController.loadCart)

//deleting item from the cart
userRoute.delete("/cart",userAuth.isUserLogin,userController.removeFromCart)

//for handling cart page updating quantity or selected items both are patch requests

userRoute.patch("/cart",userAuth.isUserLogin,handleReqBody.handleCartUpdate)

//loading the address view page
userRoute.get("/address",userAuth.isUserLogin,userController.loadAddress)

//deleting the address from the view page
userRoute.delete("/address",userAuth.isUserLogin,userController.removeAddress)

//loading the address adding page
userRoute.get("/addAddress",userAuth.isUserLogin,userController.loadAddAddress)

//adding the address to the database
userRoute.post("/addAddress",userAuth.isUserLogin,userController.addAddress)



module.exports = userRoute  
