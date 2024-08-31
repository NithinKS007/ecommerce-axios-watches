const express = require('express');
const userRoute = express.Router()

const userController = require('../controllers/userController');
const userAuth = require('../middleware/userAuth')
const passport = require('passport')
const handleReqBody = require('../middleware/handleReqBody')
const handleSearch = require('../middleware/handleSearch')
const noCacheMid = require('../middleware/cacheClearMiddleWare');
const isBlocked = require('../middleware/isBlocked');


// Home and Showcase routes
userRoute.get("/",noCacheMid.noCacheMiddleware,userController.loadHome)
userRoute.get("/home", isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadHome)
userRoute.get("/showcase",noCacheMid.noCacheMiddleware,userController.loadShowCase)

// Registration and Authentication routes
userRoute.get("/signup",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userController.loadRegister)
userRoute.post("/signup",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userController.generateOtp)
userRoute.get("/verifyOtp",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userController.otpVPage)
userRoute.post("/verifyOtp",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userController.verifyOtp)
userRoute.get("/resendOtp",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userController.resendOtp)

userRoute.get("/signin",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userController.loadsignin)
userRoute.post("/signin",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userController.verifySignin)
userRoute.get("/signout",noCacheMid.noCacheMiddleware,userController.loadUserLogout)

userRoute.get("/auth/google",noCacheMid.noCacheMiddleware,passport.authenticate('google',{scope:['email','profile']}))
userRoute.get("/google/callback",noCacheMid.noCacheMiddleware,passport.authenticate('google',{successRedirect:"/home",failureRedirect:"/signup"}))

// Product details and cart routes
userRoute.get("/productDetails", noCacheMid.noCacheMiddleware,userController.loadProductDetails)
userRoute.post("/productDetails",isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.addToCart)

userRoute.get("/cart",isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadCart)
userRoute.delete("/cart",isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.removeFromCart)
userRoute.patch("/cart",isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,handleReqBody.handleCartUpdate)
userRoute.post("/cart/applyCoupon",isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.applyCoupon)
userRoute.delete("/cart/removeCoupon",isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.removeCoupon)

// Checkout and Payment routes
userRoute.get("/checkout",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadCheckout)
userRoute.post("/checkout/addAddress",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.addAddress)
userRoute.post("/checkout",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.placeOrder)

userRoute.post("/verifyOnlinePayment",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.verifyOnlinePayment)
userRoute.get("/paymentFailure",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadPaymentFailure)
userRoute.patch("/paymentFailure",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.handleOnlinePaymentFailure)
userRoute.get("/retryPayment",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadRetryOrderCheckout)
userRoute.patch("/retryPayment",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.retryOrderPayment)

// Orders and Returns routes
userRoute.get("/placeOrder",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadPlaceOrder)
userRoute.get("/orders",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadOrders)
userRoute.patch("/orders",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.cancelOrderProduct)
userRoute.put("/orders",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.cancelOrder)
userRoute.get("/orderDetails",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadOrderDetails)
userRoute.patch("/return",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.returnProductOrder)

// Profile and Address Management routes
userRoute.get("/profile",isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadUserProfile)
userRoute.put("/profile",isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.editProfile)
userRoute.patch("/profile",isBlocked, noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.editPassword)

userRoute.get("/address",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadAddress)
userRoute.delete("/address",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.removeAddress)
userRoute.get("/addAddress",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadAddAddress)
userRoute.post("/addAddress",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.addAddress)
userRoute.put("/editAddress",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.editAddress)

// Wishlist routes
userRoute.get("/wishList",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadWishList)
userRoute.post("/wishList",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.addToWishList)
userRoute.delete("/wishList",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.removeFromWishList)

//wallet route
userRoute.get("/wallet",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userController.loadWallet)

// Forgot and Reset Password routes
userRoute.get("/forgotPassword",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userController.loadForgotPassword)
userRoute.patch("/forgotPassword",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userController.handleForgotPassword)
userRoute.get("/resetPassword",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userController.loadResetPassword)
userRoute.patch("/resetPassword",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userController.ResetPassword)

// Advanced Search Filtering routes
userRoute.get("/filter",noCacheMid.noCacheMiddleware,handleSearch.handleSearch)

module.exports = userRoute  
