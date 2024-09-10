const express = require('express')
const adminRoute = express.Router()


//new controllers seperate established
const adminAuthController = require('../controllers/adminAuthController')
const dashboardController = require('../controllers/dashboardController')
const categoryBrandController = require('../controllers/categoryBrandController')
const productController = require('../controllers/productController')
const couponController = require('../controllers/couponController')
const offerController = require('../controllers/offerController')
const adminOrderController = require('../controllers/adminOrderController')
const bestSellersController = require('../controllers/bestSellersController')
const userController = require('../controllers/userController')


//controllers for the routes
const imageUpload = require('../utils/imageUpload')
const softdeleteHandle = require('../middleware/softDeletehandle')
const handleEditCategoryBrand = require('../middleware/handleEditCategoryBrand')
const handleCategoryBrandExists = require('../middleware/handleExistCategoryBrand')
const adminAuth = require('../middleware/adminAuth')
const handleReturnStatus  = require('../middleware/handleReturnStatus')
const noCacheMid = require('../middleware/cacheClearMiddleWare')



// Admin registration and authentication
adminRoute.post("/signup",noCacheMid.noCacheMiddleware,adminAuthController.registerAdmin)
adminRoute.get("/signin",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogout,adminAuthController.loadLogin)
adminRoute.post("/signin",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogout,adminAuthController.verifyAdmin)
adminRoute.get("/signout",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminAuthController.isSignout)



// Admin dashboard and customer management
adminRoute.get("/dashboard",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,dashboardController.loadDashboard)

adminRoute.get("/customerlist",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,userController.loadCustomer)
adminRoute.patch("/customerlist",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,userController.blockOrUnblockCustomer)


// Brand and Category management
adminRoute.get("/brandCategoryManagement",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,categoryBrandController.loadCategoryBrand)
adminRoute.patch("/brandCategoryManagement",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,softdeleteHandle.handleSoftDelete)
adminRoute.put("/brandCategoryManagement",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,handleEditCategoryBrand.handleEditCategoryBrand)
adminRoute.post("/brandCategoryManagement",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,categoryBrandController.addCategoryBrand)
adminRoute.get("/brandCategoryExists",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,handleCategoryBrandExists.handleCategoryBrandExists)

// Product management
adminRoute.get("/products",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,productController.loadProducts)
adminRoute.patch("/products",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,productController.softDeleteProduct)
adminRoute.get("/addProducts",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,productController.loadaddProduct)
adminRoute.post("/addProducts",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,imageUpload.upload.array('productimages',4),productController.addProduct)
adminRoute.get("/editProduct",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,productController.loadEditProduct )
adminRoute.put("/editProduct",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,imageUpload.upload.array('productimages',4), productController.editProduct)
adminRoute.delete("/removeProductImage",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin, productController.editImage)
adminRoute.get("/productExists",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,productController.ProductExists)

// Order management
adminRoute.get("/orders",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminOrderController.loadOrderList)
adminRoute.get("/orderDetailsPage",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin, adminOrderController.loadOrderDetailsPage);
adminRoute.post("/orderDetailsPage",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminOrderController.changeOrderStatus)

//coupon management
adminRoute.get("/couponManagement",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,couponController.loadCoupon)
adminRoute.get("/addCoupon",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,couponController.loadAddCoupon)
adminRoute.post("/addCoupon",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,couponController.addCoupon)
adminRoute.patch("/couponManagement",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,couponController.activateDeactivateCoupon)

// Product return management
adminRoute.get("/updateReturnStatus",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminOrderController.loadReturnedOrder)
adminRoute.patch("/updateReturnStatus",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,handleReturnStatus.handleReturnStatus)

// Sales report
adminRoute.get("/salesReport",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,dashboardController.fetchSalesReport)
adminRoute.get("/bestSellers",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,bestSellersController.bestSellers)

// Category offer management
adminRoute.get("/categoryOffer",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,offerController.loadCategoryOffer)
adminRoute.get("/addCategoryOffer",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,offerController.loadAddCategoryOffer)
adminRoute.post("/addCategoryOffer",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,offerController.addCategoryOffer)
adminRoute.patch("/categoryOffer",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,offerController.activateDeactivateCategoryOffer)
adminRoute.get("/editCategoryOffer",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,offerController.loadEditCategoryOffer)
adminRoute.put("/editCategoryOffer",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,offerController.editCategoryOffer)


// Product offer management
adminRoute.get("/productOffer",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,offerController.loadProductOffer)
adminRoute.get("/addProductOffer",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,offerController.loadAddProductOffer)
adminRoute.post("/addProductOffer",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,offerController.addProductOffer)
adminRoute.patch("/productOffer",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,offerController.activateDeactivateProductOffer)
adminRoute.get("/editProductOffer",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,offerController.loadEditProductOffer)
adminRoute.put("/editProductOffer",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,offerController.editProductOffer)


module.exports = adminRoute