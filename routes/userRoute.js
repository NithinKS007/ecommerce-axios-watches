const express = require('express');
const userRoute = express.Router()

const userController = require('../controllers/userController');
const userAuth = require('../middleware/userAuth')
const passport = require('passport')
const handleReqBody = require('../middleware/handleReqBody')
const handleSearch = require('../middleware/handleSearch')
const noCacheMid = require('../middleware/cacheClearMiddleWare');
const isBlocked = require('../middleware/isBlocked');


// Home page before registering
userRoute.get("/",noCacheMid.noCacheMiddleware,userController.loadHome)

// Registration routes
userRoute.get("/signup",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userController.loadRegister)
userRoute.post("/signup",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userController.generateOtp)
userRoute.get("/verifyOtp",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userController.otpVPage)
userRoute.post("/verifyOtp",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userController.verifyOtp)
userRoute.get("/resendOtp",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userController.resendOtp)


// Home page after verifying OTP or signing in
userRoute.get("/home", isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadHome)


// Sign-in routes
userRoute.get("/signin",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userController.loadsignin)
userRoute.post("/signin",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userController.verifySignin)


// Google authentication
userRoute.get("/auth/google",noCacheMid.noCacheMiddleware,passport.authenticate('google',{scope:['email','profile']}))
userRoute.get("/google/callback",noCacheMid.noCacheMiddleware,passport.authenticate('google',{successRedirect:"/home",failureRedirect:"/signup"}))


// Showcase routes
userRoute.get("/showcase",isBlocked,noCacheMid.noCacheMiddleware,userController.loadShowCase)


// Product details and cart routes
userRoute.get("/productDetails",isBlocked, noCacheMid.noCacheMiddleware,userController.loadProductDetails)
userRoute.post("/productDetails",isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.addToCart)
userRoute.get("/cart",isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadCart)
userRoute.delete("/cart",isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.removeFromCart)
userRoute.patch("/cart",isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,handleReqBody.handleCartUpdate)
userRoute.post("/cart/applyCoupon",isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.applyCoupon)
userRoute.delete("/cart/removeCoupon",isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.removeCoupon)



// User profile routes
userRoute.get("/profile",isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadUserProfile)
userRoute.put("/profile",isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.editProfile)
userRoute.patch("/profile",isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.editPassword)
userRoute.get("/signout",noCacheMid.noCacheMiddleware,userController.loadUserLogout)


// Address management routes
userRoute.get("/address",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadAddress)
userRoute.delete("/address",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.removeAddress)
userRoute.get("/addAddress",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadAddAddress)
userRoute.post("/addAddress",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.addAddress)
userRoute.put("/editAddress",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.editAddress)

// Checkout route
userRoute.get("/checkout",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadCheckout)
userRoute.post("/chekout/addAddress",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.addAddress)
userRoute.post("/checkout",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.placeOrder)


//order route
userRoute.get("/placeOrder",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadPlaceOrder)
userRoute.get("/orders",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadOrders)
userRoute.patch("/orders",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.cancelOrderProduct)
userRoute.put("/orders",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.cancelOrder)

//advanced search filtering the product
userRoute.get("/filter",isBlocked,noCacheMid.noCacheMiddleware,handleSearch.handleSearch)


//wishlist route
userRoute.get("/wishList",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadWishList)
userRoute.post("/wishList",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.addToWishList)
userRoute.delete("/wishList",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.removeFromWishList)

//online payment verify route
userRoute.post("/verifyOnlinePayment",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.verifyOnlinePayment)

//wallet route
userRoute.get("/wallet",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadWallet)

//return
userRoute.patch("/return",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.returnProductOrder)




module.exports = userRoute  
