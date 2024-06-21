const express = require('express')


const adminRoute = express.Router()

const adminController = require('../controllers/adminController')

//requiring the multer function to upload the file
const imageUpload = require('../utils/imageUpload')

//requiring the middle ware for auto cropping the image
const cropImage = require('../middleware/cropImage')


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
adminRoute.post("/customerlist",adminController.blockUnblock)

//loading the category page
adminRoute.get("/brand-category-management",adminController.loadCategoryBrand)

//inserting the category
adminRoute.post("/brand-category-management",adminController.addCategoryBrand)

//loading the products page
adminRoute.get("/products",adminController.loadProducts)

//loading the add products page
adminRoute.get("/addproducts",adminController.loadaddProduct)

//inserting the products

adminRoute.post("/addproducts",imageUpload.upload.array('productimages',3),adminController.addProduct)

















module.exports = adminRoute