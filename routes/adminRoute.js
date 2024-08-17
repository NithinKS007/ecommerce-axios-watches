const express = require('express')
const adminRoute = express.Router()


const adminController = require('../controllers/adminController')
const imageUpload = require('../utils/imageUpload')
const softdeleteHandle = require('../middleware/softDeletehandle')
const editHandle = require('../middleware/handleEdit')
const handleCategoryBrandExists = require('../middleware/handleExistCategoryBrand')
const adminAuth = require('../middleware/adminAuth')
const handleReturnStatus  = require('../middleware/handleReturnStatus')

const noCacheMid = require('../middleware/cacheClearMiddleWare')

// Admin registration and authentication
adminRoute.post("/signup",noCacheMid.noCacheMiddleware,adminController.registerAdmin)
adminRoute.get("/signin",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogout,adminController.loadLogin)
adminRoute.post("/signin",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogout,adminController.verifyAdmin)
adminRoute.get("/signout",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.isSignout)



// Admin dashboard and customer management
adminRoute.get("/dashboard",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.loadDashboard)
adminRoute.get("/customerlist",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.loadCustomer)
adminRoute.patch("/customerlist",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.blockUnblock)


// Brand and category management
adminRoute.get("/brandCategoryManagement",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.loadCategoryBrand)
adminRoute.patch("/brandCategoryManagement",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,softdeleteHandle.handleSoftDelete)
adminRoute.put("/brandCategoryManagement",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,editHandle.handleEdit)
adminRoute.post("/brandCategoryManagement",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.addCategoryBrand)
adminRoute.get("/brandCategoryExists",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,handleCategoryBrandExists.handleCategoryBrandExists)

// Product management
adminRoute.get("/products",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.loadProducts)
adminRoute.patch("/products",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.softDeleteProduct)
adminRoute.get("/addProducts",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.loadaddProduct)
adminRoute.post("/addProducts",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,imageUpload.upload.array('productimages',4),adminController.addProduct)
adminRoute.get("/editProduct",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.loadEditProduct )
adminRoute.put("/editProduct",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,imageUpload.upload.array('productimages',4), adminController.editProduct)
adminRoute.delete("/removeProductImage",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin, adminController.editImage)
// adminRoute.get("/productExists",adminAuth.isAdminLogin,adminController.ProductExists)

//order list
adminRoute.get("/orders",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.loadOrderList)


//order details page
adminRoute.get("/orderDetailsPage",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin, adminController.loadOrderDetailsPage);
adminRoute.post("/orderDetailsPage",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.changeOrderStatus)


//coupon management
adminRoute.get("/couponManagement",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.loadCoupon)
adminRoute.get("/addCoupon",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.loadAddCoupon)
adminRoute.post("/addCoupon",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.addCoupon)

//product return
adminRoute.get("/updateReturnStatus",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.loadReturnedOrder)
adminRoute.patch("/updateReturnStatus",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,handleReturnStatus.handleReturnStatus)

//sales report calculate
adminRoute.get("/salesReport",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.getSalesDataJson)

adminRoute.get("/bestSellers",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.bestSellers)

adminRoute.patch("/couponManagement",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.activateDeactivateCoupon)

adminRoute.get("/categoryOffer",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.loadCategoryOffer)
adminRoute.get("/addCategoryOffer",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.loadAddCategoryOffer)
adminRoute.post("/addCategoryOffer",noCacheMid.noCacheMiddleware,adminAuth.isAdminLogin,adminController.addCategoryOffer)





module.exports = adminRoute