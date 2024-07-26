const express = require('express');
const userRoute = express.Router()

const userController = require('../controllers/userController');
const cacheController = require('../middleware/cacheControl')
const userAuth = require('../middleware/userAuth')
const passport = require('passport');
const handleReqBody = require('../middleware/handleReqBody')
const handleSearch = require('../middleware/handleSearch')

// Home page before registering
userRoute.get("/",userController.loadHome)

// Registration routes
userRoute.get("/signup",userController.loadRegister)
userRoute.post("/signup",userController.generateOtp)
userRoute.get("/verifyOtp",userController.otpVPage)
userRoute.post("/verifyOtp",userController.verifyOtp)
userRoute.get("/resendOtp",userController.resendOtp)


// Home page after verifying OTP or signing in
userRoute.get("/home",userAuth.isUserLogin,userController.loadHome)


// Sign-in routes
userRoute.get("/signin",userController.loadsignin)
userRoute.post("/signin",userController.verifySignin)


// Google authentication
userRoute.get("/auth/google",passport.authenticate('google',{scope:['email','profile']}))
userRoute.get("/google/callback",passport.authenticate('google',{successRedirect:"/home",failureRedirect:"/signup"}))


// Showcase routes
userRoute.get("/showcase",userController.loadShowCase)


// Product details and cart routes
userRoute.get("/productDetails",userController.loadProductDetails)
userRoute.post("/productDetails",userAuth.isUserLogin,userController.addToCart)
userRoute.get("/cart",userAuth.isUserLogin,userController.loadCart)
userRoute.delete("/cart",userAuth.isUserLogin,userController.removeFromCart)
userRoute.patch("/cart",userAuth.isUserLogin,handleReqBody.handleCartUpdate)




// User profile routes
userRoute.get("/profile",userAuth.isUserLogin,userController.loadUserProfile)
userRoute.put("/profile",userAuth.isUserLogin,userController.editProfile)
userRoute.patch("/profile",userAuth.isUserLogin,userController.editPassword)
userRoute.get("/signout",userController.loadUserLogout)


// Address management routes
userRoute.get("/address",userAuth.isUserLogin,userController.loadAddress)
userRoute.delete("/address",userAuth.isUserLogin,userController.removeAddress)
userRoute.get("/addAddress",userAuth.isUserLogin,userController.loadAddAddress)
userRoute.post("/addAddress",userAuth.isUserLogin,userController.addAddress)
userRoute.put("/editAddress",userAuth.isUserLogin,userController.editAddress)

// Checkout route
userRoute.get("/checkout",userAuth.isUserLogin,userController.loadCheckout)
userRoute.post("/chekout/addAddress",userAuth.isUserLogin,userController.addAddress)
userRoute.post("/checkout",userAuth.isUserLogin,userController.placeOrder)


//order route
userRoute.get("/placeOrder",userAuth.isUserLogin,userController.loadPlaceOrder)
userRoute.get("/orders",userAuth.isUserLogin,userController.loadOrders)
userRoute.patch("/orders",userAuth.isUserLogin,userController.cancelOrderProduct)
userRoute.put("/orders",userAuth.isUserLogin,userController.cancelOrder)


//advanced search filtering the product
userRoute.get("/filter",handleSearch.handleSearch)



module.exports = userRoute  
