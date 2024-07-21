const express = require('express')
const adminRoute = express.Router()


const adminController = require('../controllers/adminController')
const imageUpload = require('../utils/imageUpload')
const softdeleteHandle = require('../middleware/softDeletehandle')
const editHandle = require('../middleware/handleEdit')
const adminAuth = require('../middleware/adminAuth')


// Admin registration and authentication
adminRoute.post("/signup",adminController.registerAdmin)
adminRoute.get("/signin",adminAuth.isAdminLogout,adminController.loadLogin)
adminRoute.post("/signin",adminAuth.isAdminLogout,adminController.verifyAdmin)
adminRoute.get("/signout",adminAuth.isAdminLogin,adminController.isSignout)



// Admin dashboard and customer management
adminRoute.get("/dashboard",adminAuth.isAdminLogin,adminController.loadDashboard)
adminRoute.get("/customerlist",adminAuth.isAdminLogin,adminController.loadCustomer)
adminRoute.patch("/customerlist",adminAuth.isAdminLogin,adminController.blockUnblock)


// Brand and category management
adminRoute.get("/brandCategoryManagement",adminAuth.isAdminLogin,adminController.loadCategoryBrand)
adminRoute.patch("/brandCategoryManagement",adminAuth.isAdminLogin,softdeleteHandle.handleSoftDelete)
adminRoute.put("/brandCategoryManagement",adminAuth.isAdminLogin,editHandle.handleEdit)
adminRoute.post("/brandCategoryManagement",adminAuth.isAdminLogin,adminController.addCategoryBrand)


// Product management
adminRoute.get("/products",adminAuth.isAdminLogin,adminController.loadProducts)
adminRoute.patch("/products",adminAuth.isAdminLogin,adminController.softDeleteProduct)
adminRoute.get("/addProducts",adminAuth.isAdminLogin,adminController.loadaddProduct)
adminRoute.post("/addProducts",adminAuth.isAdminLogin,imageUpload.upload.array('productimages',4),adminController.addProduct)
adminRoute.get("/editProduct",adminAuth.isAdminLogin,adminController.loadEditProduct )
adminRoute.put("/editProduct",adminAuth.isAdminLogin,imageUpload.upload.array('productimages',4), adminController.editProduct)
adminRoute.delete("/removeProductImage",adminAuth.isAdminLogin, adminController.editImage)

//order list
adminRoute.get("/orders",adminAuth.isAdminLogin,adminController.loadOrderList)


//order details page
adminRoute.get("/orderDetailsPage", adminAuth.isAdminLogin, adminController.loadOrderDetailsPage);
adminRoute.post("/orderDetailsPage",adminAuth.isAdminLogin,adminController.changeOrderStatus)





module.exports = adminRoute