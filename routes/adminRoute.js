const express = require("express");
const adminRoute = express.Router();

// Controllers 
const adminAuthController = require("../controllers/adminAuthController");
const dashboardController = require("../controllers/dashboardController");
const categoryBrandController = require("../controllers/categoryBrandController");
const productController = require("../controllers/productController");
const couponController = require("../controllers/couponController");
const offerController = require("../controllers/offerController");
const adminOrderController = require("../controllers/adminOrderController");
const bestSellersController = require("../controllers/bestSellersController");
const userController = require("../controllers/userController");

//Middlewares
const imageUpload = require("../utils/imageUpload");
const adminAuth = require("../middleware/adminAuthMiddleware");
const noCacheMid = require("../middleware/cacheClearMiddleWare");

//Handlers
const handleReturnStatus = require("../controllers/handlers/handleReturnStatusAdmin");
const { handleViewProductOffer } = require("../controllers/handlers/handleViewProductOfferAdmin");
const { handleViewCoupon } = require("../controllers/handlers/handleViewCouponsAdmin");
const softdeleteHandle = require("../controllers/handlers/softDeletehandle");
const handleEditCategoryBrand = require("../controllers/handlers/handleEditCategoryBrand");
const handleCategoryBrandExists = require("../controllers/handlers/handleExistCategoryBrand");
const { handleViewOrdersAdmin } = require("../controllers/handlers/handleViewOrdersAdmin");
const { handleViewCategoryOffer } = require("../controllers/handlers/handleViewCategoryOffer");
const { handleViewProductsAdmin } = require("../controllers/handlers/handleViewProductsAdmin");

// Registration and authentication
adminRoute.post("/signup",noCacheMid.noCacheMiddleware,adminAuthController.registerAdmin);
adminRoute.get("/signin",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogout,adminAuthController.loadLogin);
adminRoute.post("/signin",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogout,adminAuthController.verifyAdmin);
adminRoute.get("/signout",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminAuthController.isSignout);

// Dashboard management
adminRoute.get("/dashboard",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,dashboardController.loadDashboard);

// Admin customer management
adminRoute.get("/customers",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,userController.loadCustomer);
adminRoute.patch("/customers/:id",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,userController.blockOrUnblockCustomer);

// Brand and Category management
adminRoute.get("/categories-brands",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,categoryBrandController.loadCategoryBrand);
adminRoute.get("/categories-brands-exists",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,handleCategoryBrandExists.handleCategoryBrandExists);
adminRoute.post("/categories-brands",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,categoryBrandController.addCategoryBrand);
adminRoute.patch("/categories-brands",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,softdeleteHandle.handleSoftDelete);
adminRoute.put("/categories-brands",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,handleEditCategoryBrand.handleEditCategoryBrand);

// Product management
adminRoute.get("/products",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,handleViewProductsAdmin);
adminRoute.patch("/products/:id",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,productController.softDeleteProduct);
adminRoute.post("/products",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,imageUpload.upload.array("productimages", 4),productController.addProduct);
adminRoute.put("/products/:id",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,imageUpload.upload.array("productimages", 4),productController.editProduct);
adminRoute.delete("/products/:id",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,productController.editImage);

// Order management
adminRoute.get("/orders",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,handleViewOrdersAdmin);
adminRoute.get("/orders/:id",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,handleViewOrdersAdmin);
adminRoute.post("/orders",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminOrderController.changeOrderStatus);
adminRoute.get("/orders/return",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,handleViewOrdersAdmin);
adminRoute.patch("/orders/return/:id",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,handleReturnStatus.handleReturnStatus);

// Coupon management
adminRoute.get("/coupons",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,handleViewCoupon);
adminRoute.post("/coupons",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,couponController.addCoupon);
adminRoute.patch("/coupons/:id",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,couponController.activateDeactivateCoupon);

// Sales report
adminRoute.get("/sales-report",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,dashboardController.fetchSalesReport);
adminRoute.get("/best-sellers",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,bestSellersController.bestSellers);

// Category offer management
adminRoute.get("/categories/offers",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,handleViewCategoryOffer);
adminRoute.post("/categories/offers",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,offerController.addCategoryOffer);
adminRoute.patch("/categories/:id/offers",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,offerController.activateDeactivateCategoryOffer);
adminRoute.put("/categories/:id/offers",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,offerController.editCategoryOffer);

// Product offer management
adminRoute.get("/products/offers",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,handleViewProductOffer);
adminRoute.post("/products/offers",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,offerController.addProductOffer);
adminRoute.patch("/products/:id/offers",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,offerController.activateDeactivateProductOffer);
adminRoute.put("/products/:id/offers",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,offerController.editProductOffer);

module.exports = adminRoute;
