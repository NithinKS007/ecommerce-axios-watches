const bcrypt = require('bcrypt');
const admin = require('../models/adminModel');
const users = require('../models/userModel')
const categories = require('../models/categoryModel')
const products = require('../models/productModel')
const brands = require('../models/brandModel')
const orders = require('../models/orderModel')
const mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;
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
        
        return res.status(500).send("Internal server Error")
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

        return res.status(500).send("Internal server Error")
        
    }
}

//checkig if a particular admin exists in the database
const verifyAdmin = async (req,res) =>{

    try {

        const {email,password} = req.body
  
        const adminData = await admin.findOne({email:email})

        if(!adminData){
              
           return res.status(401).render("admin/signin",{message:"Admin does not exist"})
  
        }

        const passwordMatch = await bcrypt.compare(password,adminData.password)

        if(!passwordMatch){

            return res.status(401).render("admin/signin",{message:"Email or password is incorrect"})
 
         }
        
                req.session.adminId = adminData._id;
                              
         return res.status(200).redirect("/admin/dashboard")

    } catch (error) {

        console.log(`error while verifying and finding the admin`,error.message);
        
        return res.status(500).send("Internal server Error")
    }

}
 
//rendering the dashboard of the admin
const loadDashboard = async (req,res) =>{

    try {

        return res.status(200).render('admin/dashboard');

    } catch (error) {

        console.log(`error while loading the dashboard of the admin`,error.message)

        return res.status(500).send("Internal server Error")

    }

   
}

//loading the list of customers in admins dashboard
const loadCustomer = async (req, res) => {

    const pageNumber = parseInt(req.query.page||1) 
    const perPageData = 2
    

    try {
        const totalUsers = await users.countDocuments(); // getting the total number of users
        const userData = await users.find({}).skip((pageNumber-1)*perPageData).limit(perPageData).exec()
        const totalPages = Math.ceil(totalUsers / perPageData);

       
        if (userData.length === 0) {

            return res.status(200).render("admin/customerList", {userData: [],totalPages: totalPages,currentPage: pageNumber});

        }else {

          return  res.status(200).render('admin/customerList', {userData: userData,totalPages: totalPages,currentPage: pageNumber})

        }
    } catch (error) {

        console.log(`Error while loading the customers:`, error.message);

        return res.status(500).send("Internal server Error")
        
    }
}

//blocking and unblocking the customers from the customers list 
const blockUnblock = async (req,res) =>{
    const userId = req.query.userId
    try {
        const user = await users.findById(userId)

       
        if(!user){
            return res.status(404).send('user not found')
        }
        if(user.isBlocked){
            const updatedUser = await users.findByIdAndUpdate({_id:userId},{$set:{isBlocked:false}},{new:true})
            console.log(`Unblocking happened for user from the backend isblocked to false`)
            return res.status(200).json({
                success:true,
                message:"user successfully unblocked",
                userId:updatedUser
            })
        }else{
            const updatedUser = await users.findByIdAndUpdate({_id:userId},{$set:{isBlocked:true}},{new:true})
            console.log(`Blocking happened for user from the backend isblocked to true`)
            return res.status(200).json({
                success:true,
                message:"user successfully blocked",
                userId:updatedUser
            })
        }
    } catch (error) {
        console.log(`error while blocking or unblocking the customer`,error.message);
        return res.status(500).send("Internal server Error")
    }
}
//loading the category page 
const loadCategoryBrand = async (req,res) =>{

    try {
 
        const categoriesData = await categories.find({})
        const brandsData = await brands.find({})

       return res.status(200).render('admin/brandCategoryManagement',{categoriesData,brandsData})


    } catch (error) {
        
        console.log(`cannot load the category page`,error.message);

        
        return res.status(500).send("Internal server Error")
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
        
        return res.status(500).send("Internal server Error")
        
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
        
        return res.status(500).send("Internal server Error")
    }    

   }
     
     
   
}

//editing the categories data

const editCategory = async (req,res) =>{


    const { categoryId, categoryName, categoryDescription } = req.body; 

  
    if (!categoryId ||!categoryName ||!categoryDescription) {

        return res.status(400).json({ success: false, message: "Category ID, name, and description are required" })

    }

    try {
        
        const category = await categories.findById({_id:categoryId})

        if(!category){

            return res.status(404).json({ success: false, message: "Category not found" });

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

        return res.status(500).send("Internal server Error")
        
    }
}

//for editing brand 

 const editBrand = async (req,res) =>{

    const { brandId, brandName } = req.body; 

    if (!brandId ||!brandName) {

        return res.status(400).json({ success: false, message: "Brand ID and name are required" });
    }

    try {
        
        const brand = await brands.findById({_id:brandId})

        if(!brand){

            return res.status(404).json({ success: false, message: "Brand not found" });
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
        
        return res.status(500).send("Internal server Error")
    }

 }
//loading the product page
const loadProducts = async (req,res) =>{

    try {
        const productData = await products.find({}).populate('brand')

        const categoriesData = await categories.find({})
        
       return res.status(200).render("admin/productList",{productData,categoriesData})

    } catch (error) {
        
        console.log(`error while loading the products page`,error.message);
          
        return res.status(500).send("Internal server Error")
    }
}

//loading  the product to a particular category
const loadaddProduct = async (req,res) =>{

    try {

        const categoriesData = await categories.find({})
        const brandsData = await brands.find()

      return res.status(200).render("admin/addProduct",{categoriesData,brandsData})

    } catch (error) {

        console.log(`error while adding the product`,)
        
        return res.status(500).send("Internal server Error")
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

      return  res.status(200).redirect("/admin/addProducts")
        
    } catch (error) {
        
        console.log(`cannot add the products `,error.message);
          
        return res.status(500).send("Internal server Error")
    }
}

//soft deleting the category using fetch method in frontend

const softDeleteCategory = async (req,res) =>{

    const categoryId = req.query.categoryId


    try {
        
        const category = await categories.findById({_id:categoryId})
        
        if(!category){

            return res.status(404).json({ success: false, message: "Category not found" });
        }
        
        if(category.isBlocked){

         const UpdatedCategory = await categories.findByIdAndUpdate({_id:categoryId},{$set:{isBlocked:false}},{new:true})


            console.log(`soft delete happened for category from the backend isactive to false `)

            return res.status(200).json({

                success:true,
                message:"category successfully soft deleted",
                categoryId:UpdatedCategory

            })

        }else{

        const UpdatedCategory =  await categories.findByIdAndUpdate({_id:categoryId},{$set:{isBlocked:true}},{new:true})

        console.log(`soft delete happened for category from the backend isactive to true `)

            return res.status(200).json({

                success:true,
                message:"undone category soft deletion",
                categoryId:UpdatedCategory

            })
        }


    } catch (error) {

        console.log(`error while soft deleting the category`,error.message)

          
        return res.status(500).send("Internal server Error")
        
        
    }
}

const softDeleteBrand = async (req,res) =>{

    const brandId = req.query.brandId 

    try {

        const brandData = await brands.findById({_id:brandId})

        if(!brandData){

            return res.status(404).json({ success: false, message: "Brand not found" });
        }

        if(brandData.isBlocked){

            const updatedBrand = await brands.findByIdAndUpdate({_id:brandId},{$set:{isBlocked:false}},{new:true})

            console.log(`softdelete happened for brand from the backend isactive to false `)

            return res.status(200).json({

                success:true,
                message:"brand successfully soft deleted",
                brandId:updatedBrand
            })
        }else{

            const updatedBrand = await brands.findByIdAndUpdate({_id:brandId},{$set:{isBlocked:true}},{new:true})

            
            console.log(`softdelete happened for brand from the backend isactive to true `)

            return res.status(200).json({

                success:true,
                message:"undone brand soft deletion",
                brandId:updatedBrand
            })
        }
        
    } catch (error) {
        
        console.log(`error while deleting the brand`,error.message);

          
        return res.status(500).send("Internal server Error")
    }

}

//soft deleting products

const softDeleteProduct = async (req,res) =>{

    const productId = req.query.productId 

    try {

        const productData = await products.findById({_id:productId})

        if(!productData){

            return res.status(404).json({ success: false, message: "Product not found" });

        }

        if(productData.isBlocked){

            const updatedProduct = await products.findByIdAndUpdate({_id:productId},{$set:{isBlocked:false}},{new:true})

            console.log(`softdelete happened for product from the backend isactive to false `)

            return res.status(200).json({

                success:true,
                message:"product successfully soft deleted",
                productId:updatedProduct
            })
        }else{

            const updatedProduct = await products.findByIdAndUpdate({_id:productId},{$set:{isBlocked:true}},{new:true})

            
            console.log(`softdelete happened for product from the backend isactive to true `)

            return res.status(200).json({

                success:true,
                message:"undone product soft deletion",
                productId:updatedProduct
            })
        }
        
    } catch (error) {
        
        console.log(`error while deleting the brand`,error.message);

          
        return res.status(500).send("Internal server Error")
    }

}

//logout admin

const isSignout = async (req,res) =>{

    try {

        req.session.destroy()

        res.redirect('/admin/signin')
        
    } catch (error) {
        
        console.log(`error while using the logging out function`,error.message);
    }



}

//order listing page
const loadOrderList = async (req,res) =>{

    try {

        const orderData = await orders.find({}).populate("user")

        if(orderData){

            return res.render("admin/orderList",{orderData:orderData})
        }

    } catch (error) {
        
        console.log(`error while listing the order details`,error.message);
    }
}

const priceSummary = async (cartData) => {
   
    try {
        const selectedItems = cartData.items.filter((item) => item.isSelected);
        
        const finalPrice = selectedItems.reduce((total, item) => 
            total + item.price * item.quantity, 0
        );

        const totalQuantity = selectedItems.reduce((total, item) => 
            total + item.quantity, 0
        );

        return {
            finalPrice: parseFloat(finalPrice.toFixed(2)),
            totalQuantity
        };
    } catch (error) {
        console.log(`error while calculating the price details`, error.message);
       
    }
};
const loadOrderDetailsPage = async (req, res) => {
    try {

        const { userId } = req.query;

        console.log(userId);

        const UserOrderDataDetails = await orders.find({ user: userId }).populate("user");
        
        const order = UserOrderDataDetails[0]

        const { finalPrice } = await priceSummary(order);

        console.log(finalPrice)

        return res.render("admin/orderDetailsPage", { UserOrderDataDetails,finalPrice });

    } catch (error) {

        console.log(`Error while rendering the order details page`, error.message);

        res.status(500).json({ message: "Internal Server Error" });

    }
};

const changeOrderStatus = async (req,res) =>{

    try {
        
        const { selectedStatus, orderId } = req.body

        const validStatuses = getEnumValues(orders.schema, 'orderStatus');

        
        if (!validStatuses.includes( selectedStatus)) {

          return res.status(400).json({ error: 'Invalid order status' });

        }
        
        const orderIdofTheItem = new ObjectId(orderId) 

        const updatedStatus = await orders.updateOne({_id:orderIdofTheItem},{$set:{orderStatus:selectedStatus}},{new:true})

        if(updatedStatus){

            return res.status(200).json({

                message:"successfully changed the order status",
                success:true
            })
        }else {

            return res.status(404).json({
                message: "Order not found or status unchanged",
                success: false
            });

        }
    } catch (error) {
        
        console.log(`error while updating the order status`,error.message);
    }
}
function getEnumValues(schema, path) {
    const enumValues = schema.path(path).enumValues;
    return enumValues;
  }
  
//edit product
const loadEditProduct = async (req,res) =>{

    try {

        const {productId} = req.query

        const categoriesData = await categories.find({})

        const brandsData = await brands.find({})

        const productDataToEdit = await products.findOne({_id:productId}).populate('category').populate('brand')

        return res.status(200).render("admin/editProduct",{categoriesData,brandsData,productDataToEdit})
        
    } catch (error) {
        
        console.log(`error while editing the product`,error.message);
    }
}

const editProduct = async (req, res) => {
    try {

      
        const { productId,name,brand,category,dialShape,displayType,regularPrice,salesPrice,strapMaterial,strapColor,stock,description,targetGroup } = req.body;

        const images = req.files

        const existingProduct = await products.findById(productId);

        if (!existingProduct) {

            return res.status(404).json({ message: "Product not found", success: false });

        }

        const updatedData = { name,brand,category,dialShape,displayType,regularPrice,salesPrice,strapMaterial,strapColor,stock,description,targetGroup};

        const updatedProductDetails = await products.findByIdAndUpdate(productId,{ $set: updatedData },{ new: true });
        
        if (!updatedProductDetails) {

            return res.status(404).json({ message: "Product cannot be updated" ,success:false});
        }

        
        if(images&&images.length>0){

           await products.findByIdAndUpdate(productId,{$push:{images:{$each:images}}},{new:true})
        }

        return res.status(200).json({ message: "Product updated successfully",success:true });

    } catch (error) {

        console.log(`Error while editing the product data:`, error.message);

        return res.status(400).json({ message: "Failed to update product", success:true });
    }
}

const editImage = async (req,res) =>{

    try {

        const { productId,imageName} = req.body;

        console.log(typeof imageName);
        console.log(`data from the front end`,productId,imageName);

           if (productId&&imageName) {

            await products.updateOne({ _id: productId },{ $pull: { images: { filename:imageName } } });

            return res.status(200).json({ message: "Product Image successfully removed",success:true });

        }


          return res.status(400).json({ message: "Failed to remove product image",success:false });
      

        
    } catch (error) {
        
        console.log(`error while removing the image`,error.message);
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
    editBrand,
    isSignout,
    loadOrderList,
    loadOrderDetailsPage,
    changeOrderStatus,
    loadEditProduct,
    editProduct,
    editImage

}