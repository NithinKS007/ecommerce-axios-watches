const express = require('express')

const adminRoute = express.Router()

const adminController = require('../controllers/adminController')


//requiring the multer function to upload the file
const imageUpload = require('../utils/imageUpload')


//requiring the middlware for softdeleting to identify which query is coming from the brand-category-page

const softdeleteHandle = require('../middleware/softDeletehandle')

//requiring the middleware for editing to identify which query is coming from the brand-category-page

const editHandle = require('../middleware/handleEdit')

//requiring the adminAuthetication middleware 

const adminAuth = require('../middleware/adminAuth')


//registering the admin
adminRoute.post("/signup",adminController.registerAdmin)

//loading the login page of the admin
adminRoute.get("/signin",adminController.loadLogin)

// Verifying the logged-in person is an admin
adminRoute.post("/signin",adminController.verifyAdmin)

//loading the dashboard of the admin 
adminRoute.get("/dashboard",adminAuth.isAdminLogin,adminController.loadDashboard)

//loading the customers list in admins dashboard
adminRoute.get("/customerlist",adminAuth.isAdminLogin,adminController.loadCustomer)

//blocking or unblocking the user
adminRoute.patch("/customerlist",adminAuth.isAdminLogin,adminController.blockUnblock)

//loading the category page
adminRoute.get("/brandCategoryManagement",adminAuth.isAdminLogin,adminController.loadCategoryBrand)


//soft deleting the category
adminRoute.patch("/brandCategoryManagement",adminAuth.isAdminLogin,softdeleteHandle.handleSoftDelete)


//for managing editing the brand and category in the same page

adminRoute.put("/brandCategoryManagement",adminAuth.isAdminLogin,editHandle.handleEdit)

//inserting the category
adminRoute.post("/brandCategoryManagement",adminAuth.isAdminLogin,adminController.addCategoryBrand)


//loading the products page
adminRoute.get("/products",adminAuth.isAdminLogin,adminController.loadProducts)

//softdeleting the product
adminRoute.patch("/products",adminAuth.isAdminLogin,adminController.softDeleteProduct)

//loading the add products page
adminRoute.get("/addProducts",adminAuth.isAdminLogin,adminController.loadaddProduct)

//inserting the products

adminRoute.post("/addProducts",adminAuth.isAdminLogin,imageUpload.upload.array('productimages',4),adminController.addProduct)


















module.exports = adminRoute