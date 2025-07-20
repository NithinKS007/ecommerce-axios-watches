const express = require("express");
const passport = require("passport");
const userRoute = express.Router();

// Controllers 
const userAuthController = require("../controllers/userAuthController");
const homePageController = require("../controllers/homePageController");
const cartController = require("../controllers/cartController");
const couponController = require("../controllers/couponController");
const wishListController = require("../controllers/wishListController");
const userProfileController = require("../controllers/userProfileController");
const addressController = require("../controllers/addressController");
const walletController = require("../controllers/walletController");
const userOrderController = require("../controllers/userOrderController");
const checkoutOnlinePaymentController = require("../controllers/checkoutOnlinePaymentController");

//Middlewares
const userAuth = require("../middleware/userAuthMiddleware");
const noCacheMid = require("../middleware/cacheClearMiddleWare");
const isBlocked = require("../middleware/checkBlockStatusMiddleware");

//Handlers
const { handleViewOrders } = require("../controllers/handlers/handleViewOrders");
const handleCartUpdate = require("../controllers/handlers/handleCartUpdate");
const { handleViewAddress } = require("../controllers/handlers/handleViewAddress");

// Home and Showcase routes
userRoute.get("/", noCacheMid.noCacheMiddleware, homePageController.loadHome);
userRoute.get("/home",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,homePageController.loadHome);
userRoute.get("/showcase",noCacheMid.noCacheMiddleware,homePageController.loadShowCase);

// Registration and Authentication routes
userRoute.get("/signup",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userAuthController.loadRegister);
userRoute.post("/signup",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userAuthController.generateOtp);
userRoute.post("/verify-otp",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userAuthController.verifyOtp);
userRoute.get("/resend-otp",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userAuthController.resendOtp);

userRoute.get("/signin",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userAuthController.loadsignin);
userRoute.post("/signin",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userAuthController.verifySignin);
userRoute.get("/signout",noCacheMid.noCacheMiddleware,userAuthController.loadUserLogout);

userRoute.get("/auth/google",noCacheMid.noCacheMiddleware,passport.authenticate("google", { scope: ["email", "profile"] }));
userRoute.get("/google/callback",noCacheMid.noCacheMiddleware,passport.authenticate("google", {
successRedirect: "/home",
failureRedirect: "/signup"}));

// Forgot and Reset Password routes
userRoute.get("/forgot-password",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userAuthController.loadForgotPassword);
userRoute.patch("/forgot-password",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userAuthController.handleForgotPassword);
userRoute.get("/reset-password",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userAuthController.loadResetPassword);
userRoute.patch("/reset-password",noCacheMid.noCacheMiddleware,userAuth.isUserLogout,userAuthController.ResetPassword);

// Product details and cart routes
userRoute.get("/products/:id",noCacheMid.noCacheMiddleware,homePageController.loadProductDetails);
userRoute.post("/products/:id",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,cartController.addToCart);

userRoute.get("/cart",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,cartController.loadCart);
userRoute.delete("/cart",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,cartController.removeFromCart);
userRoute.patch("/cart",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,handleCartUpdate.handleCartUpdate);
userRoute.post("/cart/coupon",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,couponController.applyCoupon);
userRoute.delete("/cart/coupon",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,couponController.removeCoupon);

// Checkout and Payment routes
userRoute.get("/checkout",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userOrderController.loadCheckout);
userRoute.post("/checkout",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userOrderController.placeOrder);

userRoute.post("/payments/verify",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,checkoutOnlinePaymentController.verifyOnlinePayment);
userRoute.patch("/payments/failure",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,checkoutOnlinePaymentController.handleOnlinePaymentFailure);
userRoute.get("/payments/failure",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,checkoutOnlinePaymentController.loadPaymentFailure);
userRoute.get("/retryPayment",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,checkoutOnlinePaymentController.loadRetryOrderCheckout);
userRoute.patch("/retryPayment",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,checkoutOnlinePaymentController.retryOrderPayment);

// Orders and Returns routes
userRoute.get("/orders",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,handleViewOrders);
userRoute.get("/orders/:id",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,handleViewOrders)
userRoute.get("/orders/confirmation",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,handleViewOrders);
userRoute.put("/orders",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userOrderController.cancelOrder);
userRoute.patch("/orders",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userOrderController.cancelOrderProduct);
userRoute.post("/orders/return",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userOrderController.returnProductOrder);

// Profile and Address Management routes
userRoute.get("/profile",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userProfileController.loadUserProfile);
userRoute.put("/profile",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userProfileController.editProfile);
userRoute.patch("/profile",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,userProfileController.editPassword);

userRoute.get("/address",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,handleViewAddress);
userRoute.post("/address",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,addressController.addAddress);
userRoute.delete("/address/:id",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,addressController.removeAddress);
userRoute.put("/address/:id",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,addressController.editAddress);

// Wishlist routes
userRoute.get("/wishlist",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,wishListController.loadWishList);
userRoute.post("/wishlist/:id",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,wishListController.addToWishList);
userRoute.delete("/wishlist/:id",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,wishListController.removeFromWishList);

// Wallet routes
userRoute.get("/wallet",isBlocked,noCacheMid.noCacheMiddleware,userAuth.isUserLogin,walletController.loadWallet);

module.exports = userRoute;
