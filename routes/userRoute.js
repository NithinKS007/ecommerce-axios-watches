const express = require("express");
const passport = require("passport");
const userRoute = express.Router();

//controllers for the routes
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

//middlewares for the routes
const userAuth = require("../middleware/userAuth");
const handleCartUpdate = require("../middleware/handleCartUpdate");
const handleSearch = require("../middleware/handleSearch");
const noCacheMid = require("../middleware/cacheClearMiddleWare");
const isBlocked = require("../middleware/isBlocked");

// Home and Showcase routes
userRoute.get("/", noCacheMid.noCacheMiddleware, homePageController.loadHome);
userRoute.get(
  "/home",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  homePageController.loadHome
);
userRoute.get(
  "/showcase",
  noCacheMid.noCacheMiddleware,
  homePageController.loadShowCase
);

// Registration and Authentication routes
userRoute.get(
  "/signup",
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogout,
  userAuthController.loadRegister
);
userRoute.post(
  "/signup",
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogout,
  userAuthController.generateOtp
);
userRoute.post(
  "/verifyOtp",
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogout,
  userAuthController.verifyOtp
);
userRoute.get(
  "/resendOtp",
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogout,
  userAuthController.resendOtp
);

userRoute.get(
  "/signin",
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogout,
  userAuthController.loadsignin
);
userRoute.post(
  "/signin",
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogout,
  userAuthController.verifySignin
);
userRoute.get(
  "/signout",
  noCacheMid.noCacheMiddleware,
  userAuthController.loadUserLogout
);

userRoute.get(
  "/auth/google",
  noCacheMid.noCacheMiddleware,
  passport.authenticate("google", { scope: ["email", "profile"] })
);
userRoute.get(
  "/google/callback",
  noCacheMid.noCacheMiddleware,
  passport.authenticate("google", {
    successRedirect: "/home",
    failureRedirect: "/signup",
  })
);

// Forgot and Reset Password routes
userRoute.get(
  "/forgotPassword",
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogout,
  userAuthController.loadForgotPassword
);
userRoute.patch(
  "/forgotPassword",
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogout,
  userAuthController.handleForgotPassword
);
userRoute.get(
  "/resetPassword",
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogout,
  userAuthController.loadResetPassword
);
userRoute.patch(
  "/resetPassword",
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogout,
  userAuthController.ResetPassword
);

// Product details and cart routes
userRoute.get(
  "/productDetails",
  noCacheMid.noCacheMiddleware,
  homePageController.loadProductDetails
);
userRoute.post(
  "/productDetails",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  cartController.addToCart
);

userRoute.get(
  "/cart",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  cartController.loadCart
);
userRoute.delete(
  "/cart",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  cartController.removeFromCart
);
userRoute.patch(
  "/cart",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  handleCartUpdate.handleCartUpdate
);
userRoute.post(
  "/cart/applyCoupon",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  couponController.applyCoupon
);
userRoute.delete(
  "/cart/removeCoupon",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  couponController.removeCoupon
);

// Checkout and Payment routes
userRoute.get(
  "/checkout",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  userOrderController.loadCheckout
);
userRoute.post(
  "/checkout/addAddress",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  addressController.addAddress
);
userRoute.post(
  "/checkout",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  userOrderController.placeOrder
);

userRoute.post(
  "/verifyOnlinePayment",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  checkoutOnlinePaymentController.verifyOnlinePayment
);
userRoute.get(
  "/paymentFailure",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  checkoutOnlinePaymentController.loadPaymentFailure
);
userRoute.patch(
  "/paymentFailure",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  checkoutOnlinePaymentController.handleOnlinePaymentFailure
);
userRoute.get(
  "/retryPayment",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  checkoutOnlinePaymentController.loadRetryOrderCheckout
);
userRoute.patch(
  "/retryPayment",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  checkoutOnlinePaymentController.retryOrderPayment
);

// Orders and Returns routes
userRoute.get(
  "/placeOrder",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  userOrderController.loadPlaceOrder
);
userRoute.get(
  "/orders",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  userOrderController.loadOrders
);
userRoute.patch(
  "/orders",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  userOrderController.cancelOrderProduct
);
userRoute.put(
  "/orders",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  userOrderController.cancelOrder
);
userRoute.get(
  "/orderDetails",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  userOrderController.loadOrderDetails
);
userRoute.patch(
  "/return",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  userOrderController.returnProductOrder
);

// Profile and Address Management routes
userRoute.get(
  "/profile",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  userProfileController.loadUserProfile
);
userRoute.put(
  "/profile",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  userProfileController.editProfile
);
userRoute.patch(
  "/profile",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  userProfileController.editPassword
);

userRoute.get(
  "/address",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  addressController.loadAddress
);
userRoute.delete(
  "/address",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  addressController.removeAddress
);
userRoute.get(
  "/addAddress",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  addressController.loadAddAddress
);
userRoute.post(
  "/addAddress",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  addressController.addAddress
);
userRoute.put(
  "/editAddress",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  addressController.editAddress
);

// Wishlist routes
userRoute.get(
  "/wishList",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  wishListController.loadWishList
);
userRoute.post(
  "/wishList",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  wishListController.addToWishList
);
userRoute.delete(
  "/wishList",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  wishListController.removeFromWishList
);

//wallet route
userRoute.get(
  "/wallet",
  isBlocked,
  noCacheMid.noCacheMiddleware,
  userAuth.isUserLogin,
  walletController.loadWallet
);

// Advanced Search Filtering routes
userRoute.get(
  "/filter",
  noCacheMid.noCacheMiddleware,
  handleSearch.handleSearch
);

module.exports = userRoute;
