const express = require('express')

const adminRoute = express.Router()

const adminController = require('../controllers/adminController')


//requiring the multer function to upload the file
const imageUpload = require('../utils/imageUpload')

//requiring the middle ware for auto cropping the image
const cropImage = require('../middleware/cropImage')

//requiring the middlware for softdeleting to identify which query is coming from the brand-category-page

const softdeleteHandle = require('../middleware/softDeletehandle')

//registering the admin
adminRoute.post("/signup",adminController.registerAdmin)

//loading the login page of the admin
adminRoute.get("/signin",adminController.loadLogin)

// Verifying the logged-in person is an admin
adminRoute.post("/signin",adminController.verifyAdmin)

//loading the dashboard of the admin 
adminRoute.get("/dashboard",adminController.loadDashboard)

//loading the customers list in admins dashboard
adminRoute.get("/customerlist",adminController.loadCustomer)

//blocking or unblocking the user
adminRoute.patch("/customerlist",adminController.blockUnblock)

//loading the category page
adminRoute.get("/brand-category-management",adminController.loadCategoryBrand)


//soft deleting the category
adminRoute.patch("/brand-category-management",softdeleteHandle.handleSoftDelete)

//changing the category name and discription
adminRoute.put("/brand-category-management",adminController.editCategory)

//inserting the category
adminRoute.post("/brand-category-management",adminController.addCategoryBrand)


//loading the products page
adminRoute.get("/products",adminController.loadProducts)

//softdeleting the product
adminRoute.patch("/products",adminController.softDeleteProduct)

//loading the add products page
adminRoute.get("/addproducts",adminController.loadaddProduct)

//inserting the products

adminRoute.post("/addproducts",imageUpload.upload.array('productimages',4),cropImage.cropImg,adminController.addProduct)


















module.exports = adminRoute