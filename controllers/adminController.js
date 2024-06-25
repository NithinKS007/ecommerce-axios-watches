const bcrypt = require('bcrypt');
const admin = require('../models/adminModel');
const users = require('../models/userModel')
const categories = require('../models/categoryModel')
const products = require('../models/productModel')
const brands = require('../models/brandModel')

//hashing the password of admin
const securePassword = async(password) =>{
    try {

        const passwordHash = await bcrypt.hash(password,10) 
        return passwordHash

    } catch (error) {

        console.log(`error in hashing the password`,error.message);
        
    }
}

//loading the login page of admin 
const loadLogin = (req,res) =>{
    try {


       return  res.status(200).render('admin/signin')

    } catch (error) {

        console.log(`cannot load login page of the admin`,error.message);
        
    }
}

//registering the admin
const registerAdmin = async (req,res) =>{

    const {fname,lname,email,password,phone} = req.body

    console.log(req.body);
    try {

        const hashedPassword = await securePassword(password)

        const regAdmin = await new admin({

            fname:fname,
            lname:lname,
            email:email,
            password:hashedPassword,
            phone:phone

        })

        const adminData = await regAdmin.save()

         
    } catch (error) {

        console.log(`error while registering admin`,error.message);
        
    }
}

//checkig if a particular admin exists in the database
const verifyAdmin = async (req,res) =>{

    try {

        const {email,password} = req.body
  
        const adminData = await admin.findOne({email:email})

        if(!adminData){
              
           return res.status(404).render("admin/signin",{message:"admin does not exist"})
  
        }
            const passwordMatch = await bcrypt.compare(password,adminData.password)

            if(!passwordMatch){

                return res.status(404).render("admin/signin",{message:"email or password is incorrect"})
            }

            if(!adminData.isAdmin){

                return res.status(404).render("admin/signin",{message:"user cannot login here"})
            }
            
            req.session.admin_id = adminData._id;
            req.session.isAdmin  = adminData.isAdmin 
                                                                                
          
            return res.status(200). redirect("/admin/dashboard")

    } catch (error) {

        console.log(`error while verifying and finding the admin`,error.message);
        
    }

}
 
//rendering the dashboard of the admin
const loadDashboard = async (req,res) =>{

    try {

        return res.status(200).render('admin/dashboard');

    } catch (error) {

        console.log(`error while loading the dashboard of the admin`,error.message)

    }

    // res.render('admin/dashboard')
}

//loading the list of customers in admins dashboard
const loadCustomer = async (req, res) => {
    try {
        const userDataArray = await users.find({})
       
        if (userDataArray.length === 0) {

            res.render("admin/customerList")

        } else {

            res.render('admin/customerList', { userDataArray: userDataArray })

        }
    } catch (error) {

        console.log(`Error while loading the customers:`, error.message);
        
    }
}

//blocking and unblocking the customers from the customers list 
const blockUnblock = async (req,res) =>{

    const id = req.query.id

    try {

        const user = await users.findById({_id:id})

        if(!user){

            return res.status(404).send('user not found')
        }

        if(user.is_blocked){

            user.is_blocked = false

        }else{
            
            user.is_blocked = true
        }

           await  user.save()
 
       return res.redirect("/admin/customerlist")
    
    } catch (error) {

        console.log(`error while blocking or unblocking the customer`,error.message);
        
    }
}

//loading the category page 
const loadCategoryBrand = async (req,res) =>{

    try {
 
        const categoriesData = await categories.find({})
        const brandsData = await brands.find({})

        res.render('admin/brandCategoryManagement',{categoriesData,brandsData})


    } catch (error) {
        
        console.log(`cannot load the category page`,error.message);
    }
}

//adding category to the category page 
const addCategoryBrand = async (req,res) =>{

    const {cName,cDescription} = req.body   
    const {bName} = req.body

   if(cName&&cDescription){

    try {

        const category = new categories({

            name:cName.trim(),
            description:cDescription

        })

      const  categoryData = await category.save()

      res.redirect("/admin/brand-category-management")

    } catch (error) {

        console.log(`error adding the category`,error.message);   
    }    

   }else if(bName){

    try {

        const brand = new brands({

            name:bName.trim(),

        })

      const   brandData = await brand.save()

      res.redirect("/admin/brand-category-management")

    } catch (error) {

        console.log(`error adding the brand`,error.message);   
    }    

   }
     
     
   
}

//loading the product page
const loadProducts = async (req,res) =>{

    try {
        const productData = await products.find({}).populate('brand')

        const categoriesData = await categories.find({})
        
       res.render("admin/productList",{productData,categoriesData})

    } catch (error) {
        
        console.log(`error while loading the products page`,error.message);
    }
}

//loading  the product to a particular category
const loadaddProduct = async (req,res) =>{

    try {

        const categoriesData = await categories.find({})
        const brandsData = await brands.find()

        res.render("admin/addProduct",{categoriesData,brandsData})

    } catch (error) {

        console.log(`error while adding the product`,)
        
    }
}

//adding the products to coming from the body

const addProduct = async (req,res) =>{

 

    try {

        const {name,brand,category,dialShape,displayType,regularPrice,salesPrice,strapMaterial,strapColor,stock,description,targetGroup} = req.body

        const brandFromcollection = await brands.find({name:brand})
        
        const categoryFromcollection = await categories.find({name:category})

        const product = new products({
    
            name:name,
            brand:brandFromcollection[0]._id,
            category:categoryFromcollection[0]._id,
            dialShape:dialShape,
            displayType:displayType,
            regularPrice:regularPrice,
            salesPrice:salesPrice,
            strapMaterial:strapMaterial,
            strapColor:strapColor,
            stock:stock,
            description:description,
            targetGroup:targetGroup,
            images: req.files //converting it to array because its 3 images
        })
    
        const productData = await product.save()
    
        if(productData){
    
            console.log(`successfull registration`,productData);
        }

      return  res.redirect("/admin/addproducts")
        
    } catch (error) {
        
        console.log(`cannot add the products `,error.message);
    }
}

module.exports = {

    loadLogin,
    registerAdmin,
    verifyAdmin,
    loadDashboard,
    loadCustomer,
    blockUnblock,
    loadCategoryBrand,
    addCategoryBrand,
    loadProducts,
    loadaddProduct,
    addProduct

}