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
        const userData = await users.find({})
       
        if (userData.length === 0) {

            res.render("admin/customerList")

        } else {

            res.render('admin/customerList', { userData: userData })

        }
    } catch (error) {

        console.log(`Error while loading the customers:`, error.message);
        
    }
}

//blocking and unblocking the customers from the customers list 
const blockUnblock = async (req,res) =>{

    const userId = req.query.userId

    try {

        const user = await users.findById({_id:userId})

        if(!user){

            return res.status(404).send('user not found')
        }

        if(user.is_blocked){

           const updatedUser = await users.findByIdAndUpdate({_id:userId},{$set:{is_blocked:false}})

           console.log(`softdeleting happened for user from the backend isblocked to false`)

           return res.status(200).json({

            success:true,
            message:"user successfully soft deleted",
            userId:updatedUser

           })

        }else{
            
            const updatedUser = await users.findByIdAndUpdate({_id:userId},{$set:{is_blocked:true}})

            console.log(`soft delete happened for user from the backend isblocked to true`)

            return res.status(200).json({

                success:true,
                message:"undone user soft deletion",
                userId:updatedUser
            })

        }

    
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

      res.redirect("/admin/brandCategoryManagement")

    } catch (error) {

        console.log(`error adding the category`,error.message);   
    }    

   }else if(bName){

    try {

        const brand = new brands({

            name:bName.trim(),

        })

      const   brandData = await brand.save()

      res.redirect("/admin/brandCategoryManagement")

    } catch (error) {

        console.log(`error adding the brand`,error.message);   
    }    

   }
     
     
   
}

//editing the categories data

const editCategory = async (req,res) =>{

    const categoryId = req.query.categoryId
    const categoryName = req.query.categoryName
    const categoryDescription = req.query.categoryDescription

    try {
        
        const category = await categories.findById({_id:categoryId})

        if(!category){

            return res.status(404).send("category not found")
          }

          if(category){

            const UpdatedCategory = await categories.findByIdAndUpdate({_id:categoryId},{$set:{name:categoryName,description:categoryDescription}})
   
   
               console.log(`category data edited function worked `)
   
               return res.status(200).json({
   
                   success:true,
                   message:"category successfully edited",
                   categoryDetails:UpdatedCategory
   
               })
   
           }


    } catch (error) {

        console.log(`error while editing the category`,error.message);
        
    }
}

//for editing brand 

 const editBrand = async (req,res) =>{

    const brandId = req.query.brandId
    const brandName = req.query.brandName

    try {
        
        const brand = await brands.findById({_id:brandId})

        if(!brand){

            return res.status(404).send("brand not found")
        }

        if(brand){

            const updatedBrand = await brands.findByIdAndUpdate({_id:brandId},{$set:{name:brandName}})

            console.log(`brand data edited function worked`)

            return res.status(200).json({

                success:true,
                message:"brand successfully edited",
                brandDetails:updatedBrand
            })
        }

    } catch (error) {
        
        console.log(`error while editing the brand`,error.message);
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

      return  res.redirect("/admin/addProducts")
        
    } catch (error) {
        
        console.log(`cannot add the products `,error.message);
    }
}

//soft deleting the category using fetch method in frontend

const softDeleteCategory = async (req,res) =>{

    const categoryId = req.query.categoryId


    try {
        
        const category = await categories.findById({_id:categoryId})
        
        if(!category){

          return res.status(404).send("category not found")
        }
        
        if(category.isActive){

         const UpdatedCategory = await categories.findByIdAndUpdate({_id:categoryId},{$set:{isActive:false}})


            console.log(`soft delete happened for category from the backend isactive to false `)

            return res.status(200).json({

                success:true,
                message:"category successfully soft deleted",
                categoryId:UpdatedCategory

            })

        }else{

        const UpdatedCategory =  await categories.findByIdAndUpdate({_id:categoryId},{$set:{isActive:true}})

        console.log(`soft delete happened for category from the backend isactive to true `)

            return res.status(200).json({

                success:true,
                message:"undone category soft deletion",
                categoryId:UpdatedCategory

            })
        }


    } catch (error) {

        console.log(`error while soft deleting the category`,error.message)
        
        
    }
}

const softDeleteBrand = async (req,res) =>{

    const brandId = req.query.brandId 

    try {

        const brandData = await brands.findById({_id:brandId})

        if(!brandData){

            return res.status(404).send("brand not found")
        }

        if(brandData.isActive){

            const updatedBrand = await brands.findByIdAndUpdate({_id:brandId},{$set:{isActive:false}})

            console.log(`softdelete happened for brand from the backend isactive to false `)

            return res.status(200).json({

                success:true,
                message:"brand successfully soft deleted",
                brandId:updatedBrand
            })
        }else{

            const updatedBrand = await brands.findByIdAndUpdate({_id:brandId},{$set:{isActive:true}})

            
            console.log(`softdelete happened for brand from the backend isactive to true `)

            return res.status(200).json({

                success:true,
                message:"undone brand soft deletion",
                brandId:updatedBrand
            })
        }
        
    } catch (error) {
        
        console.log(`error while deleting the brand`,error.message);
    }

}

//soft deleting products

const softDeleteProduct = async (req,res) =>{

    const productId = req.query.productId 

    try {

        const productData = await products.findById({_id:productId})

        if(!productData){

            return res.status(404).send("product not found")
        }

        if(productData.isActive){

            const updatedProduct = await products.findByIdAndUpdate({_id:productId},{$set:{isActive:false}})

            console.log(`softdelete happened for product from the backend isactive to false `)

            return res.status(200).json({

                success:true,
                message:"product successfully soft deleted",
                productId:updatedProduct
            })
        }else{

            const updatedProduct = await products.findByIdAndUpdate({_id:productId},{$set:{isActive:true}})

            
            console.log(`softdelete happened for product from the backend isactive to true `)

            return res.status(200).json({

                success:true,
                message:"undone product soft deletion",
                productId:updatedProduct
            })
        }
        
    } catch (error) {
        
        console.log(`error while deleting the brand`,error.message);
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
    addProduct,
    softDeleteCategory,
    softDeleteBrand,
    softDeleteProduct,
    editCategory,
    editBrand

}