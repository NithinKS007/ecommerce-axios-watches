const bcrypt = require('bcrypt');
const mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const admin = require('../models/adminModel');
const users = require('../models/userModel')
const categories = require('../models/categoryModel')
const brands = require('../models/brandModel')
const products = require('../models/productModel')
const orders = require('../models/orderModel')
const coupons = require('../models/couponModel');

const returnUserOrder = require('../models/returnOrderModel')

const wallet = require('../models/walletModel')
const dayjs = require('dayjs');
const order = require('../models/orderModel');

//hashing password
const securePassword = async(password) =>{
    try {

        const passwordHash = await bcrypt.hash(password,10) 
        return passwordHash

    } catch (error) {

        console.log(`error in hashing the password`,error.message);
        
    }
}

// renders the admin login page
const loadLogin = (req,res) =>{
    try {

       return  res.status(200).render('admin/signin')

    } catch (error) {

        console.log(`cannot load login page of the admin`,error.message);
        
        return res.status(500).send("Internal server Error")
    }
}

// registers a new admin
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

// verifies admin
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

                req.session.successMessage = "Login successful! Welcome back admin"
                              
         return res.status(200).redirect("/admin/dashboard")

    } catch (error) {

        console.log(`error while verifying and finding the admin`,error.message);
        
        return res.status(500).send("Internal server Error")
    }

}
 
// logs out the admin
const isSignout = async (req,res) =>{

    try {

        req.session.destroy()

        res.redirect('/admin/signin')
        
    } catch (error) {
        
        console.log(`error while using the logging out function`,error.message);
    }



}

//renders the admin dashboard
const loadDashboard = async (req,res) =>{

    try {
     
        const startOfMonth = dayjs().startOf('month').toDate();

        const today = dayjs().endOf('day').toDate();

        const successMessage = req.session.successMessage

        req.session.successMessage = null

        const [totalSalesC, totalOrders, { totalProducts, totalCategories }, monthlyRev, totalRev, overallSalesTotalAmount, overAllDiscountAmount, tableSalesData] = await Promise.all([
            totalSalesCount(),
            countTotalOrders(),
            aggregateProductByCategory(),
            monthlyAvg(),
            totalRevenue(),
            overAllOrderAmount(),
            overAllDiscount(),
            getSalesData(startOfMonth,today),
        ]);

        console.log(`this is the data`,tableSalesData);
    
         const [{ date } = {}] = tableSalesData;

        let tableTotalNumberOfOrders = 0;
        let tableTotalGrossSales = 0;
        let tableTotalCouponDeductions = 0;
        let tableTotalNetSales = 0;

        tableSalesData.forEach(sale => {
            tableTotalNumberOfOrders += sale.totalNumberOfOrders || 0;
            tableTotalGrossSales += sale.grossSales || 0;
            tableTotalCouponDeductions += sale.couponDeductions || 0;
            tableTotalNetSales += sale.netSales || 0;
        });


        return res.status(200).render('admin/dashboard',{successMessage,totalOrders,totalProducts,totalCategories,monthlyRev,startOfMonth: startOfMonth,

            today:today,totalRev,totalSalesC,overallSalesTotalAmount,overAllDiscountAmount,tableTotalNumberOfOrders,tableTotalGrossSales,tableTotalCouponDeductions,tableTotalNetSales,tableSalesData,date})

    } catch (error) {

        console.log(`error while loading the dashboard of the admin`,error.message)

        return res.status(500).send("Internal server Error")

    }

   
}
const overAllDiscount = async () =>{

    try {
        
        const orderList = await orders.find({},{discountAmount:1})

        const totalDiscountAmount = orderList.reduce((acc,order)=>acc + order.discountAmount,0)

        return totalDiscountAmount


    } catch (error) {
        
        console.log(`error while calculating the discount`,error.message);
        
    }
} 

const overAllOrderAmount = async () =>{

    try {

        const ordersList = await orders.find({}, { totalAmount: 1 })

        const totalSalesAmount = ordersList.reduce((acc, order) => acc + order.totalAmount, 0)

        return totalSalesAmount
      

    } catch (error) {
        
        console.log(`error while calculating the overall sales amount`,error.message);
        
    }
}
const totalSalesCount = async() =>{

    try {
        
       return await orders.countDocuments()

    } catch (error) {
        
        console.log(`error while calculating the sales count`,error.message);
        
    }
}
const countTotalOrders = async () =>{

    try {

        return await orders.countDocuments();
        
    } catch (error) {
        
        console.log(`error while getting the total orders`,error.message);
        
    }
}
const aggregateProductByCategory = async () => {

    try {
        const productByCategory = await products.aggregate([
            { $match: { stock: { $gt: 0 } } },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryDetails',
                },
            },
            { $unwind: '$categoryDetails' },
            {
                $group: {
                    _id: '$categoryDetails.name',
                    productCount: { $sum: 1 },
                },
            },
        ]);
        const totalProducts = productByCategory.reduce((sum, category) => sum + category.productCount, 0);

        const totalCategories = productByCategory.length;

        return { totalProducts, totalCategories };

    } catch (error) {

        console.log(`error while getting the total products`,error.message);
    }
};


const monthlyAvg = async () =>{

    try {

        const startOfMonth = dayjs().startOf('month').toDate();

        const today = dayjs().endOf('day').toDate();

        const ordersThisMonth = await orders.find({orderDate:{$gte:startOfMonth,$lte:today}})

        let MonthlyRevUntilNow = 0

        ordersThisMonth.forEach(order =>{

            order.items.forEach(item =>{

                if(item.orderProductStatus==="delivered"){

                    const itemTotalAmount = item.price*item.quantity

                    const itemProportion = itemTotalAmount/order.subTotalAmount

                    const itemDiscount = itemProportion*order.discountAmount

                    const priceAfterEverything = itemTotalAmount - itemDiscount

                    MonthlyRevUntilNow +=priceAfterEverything
                }
            })
        })

        return MonthlyRevUntilNow.toFixed(2)
        
    } catch (error) {
        
        console.log(`error while getting the monthly average`,error.message);
        
    }
}

const totalRevenue = async () =>{

    try {

        const allOrders = await orders.find({})

        let totalRev = 0

        allOrders.forEach(order => {

            order.items.forEach(item =>{

                if(item.orderProductStatus==="delivered"){

                    const itemTotalAmount = item.price*item.quantity

                     const itemProportion = itemTotalAmount/order.subTotalAmount

                     const itemDiscount = itemProportion*order.discountAmount

                     const priceAfterEverything = itemTotalAmount - itemDiscount

                     totalRev +=priceAfterEverything
                }
            })
        })


        return totalRev.toFixed(2)
        
    } catch (error) {
        
        console.log(`error while calculating the total revenue`,error.message);
        
    }

}

const getSalesDataJson = async (req,res) =>{

    try {
    
         const { dateFrom, dateTill, period } = req.query;

         console.log(`this is the data from the front end`,dateFrom, dateTill, period)

         let tableTotalNumberOfOrders = 0;
         let tableTotalGrossSales = 0;
         let tableTotalCouponDeductions = 0;
         let tableTotalNetSales = 0;
 
         
        if(dateFrom&&dateTill){

            startDate =  dayjs(dateFrom).startOf('day').toDate();
            endDate = dayjs(dateTill).endOf('day').toDate();

            const salesData = await getSalesData(startDate,endDate)

            salesData.forEach(sale => {
                        tableTotalNumberOfOrders += sale.totalNumberOfOrders || 0;
                        tableTotalGrossSales += sale.grossSales || 0;
                        tableTotalCouponDeductions += sale.couponDeductions || 0;
                        tableTotalNetSales += sale.netSales || 0;
                    });
            return res.status(200).json({message:"sales data for the the given dates",salesData,tableTotalNumberOfOrders, tableTotalGrossSales,tableTotalCouponDeductions,tableTotalNetSales});

        }else{

             console.log('Period:', period);

             switch (period) {
                case 'today':
                    startDate = dayjs().startOf('day').toDate();
                    endDate = dayjs().endOf('day').toDate();
                    break;
                case 'week':
                    startDate = dayjs().startOf('week').toDate();
                    endDate = dayjs().endOf('week').toDate();
                    break;
                case 'month':
                    startDate = dayjs().startOf('month').toDate();
                    endDate = dayjs().endOf('month').toDate();
                    break;
                default:
                    throw new Error('Invalid period specified');
            }

            const salesData = await getSalesData(startDate, endDate);

        
        salesData.forEach(sale => {
            tableTotalNumberOfOrders += sale.totalNumberOfOrders || 0;
            tableTotalGrossSales += sale.grossSales || 0;
            tableTotalCouponDeductions += sale.couponDeductions || 0;
            tableTotalNetSales += sale.netSales || 0;
        });

            return res.status(200).json({message:"sales data for the the given period of time",salesData,tableTotalNumberOfOrders, tableTotalGrossSales,tableTotalCouponDeductions,tableTotalNetSales});
        }

    } catch (error) {

        console.error('Error while fetching sales data:', error.message);

        return res.status(500).json({ success: false, message: 'An error occurred while fetching sales data.' });
    }

}

const getSalesData = async (startDate,endDate) =>{

    try {
        
        const matchStage = {$match:{ "items.orderProductStatus": "delivered"}}
       
       if(startDate && endDate) {

        matchStage.$match.orderDate = {$gte:new Date(startDate),$lte:new Date(endDate)}

       }

       const pipeline = [

        matchStage,
        {
            $unwind:"$items"
        },
        {
            $match:{
                "items.orderProductStatus":"delivered"
            }
        },
        {
            $group:{

                _id:{

                    date: { $dateToString: { format: "%d-%b-%Y", date: "$orderDate" } }
                },

                totalNumberOfOrders : {$sum:1},
                grossSales :{ $sum :{$multiply:["$items.price","$items.quantity"]}},

                couponDeductions:{

                    $sum:{

                        $multiply: [
                            { $divide: [{ $multiply: ["$items.price", "$items.quantity"] }, "$subTotalAmount"] },
                            "$discountAmount"
                        ]
                    }
                }
            }
        },
        {
            $project:{

                date:"$_id.date",
                totalNumberOfOrders:1,
                grossSales:1,
                couponDeductions:1,
                netSales:{ $subtract: ["$grossSales", "$couponDeductions"]}
            }
        }
       ]
       const salesData = await orders.aggregate(pipeline).exec();

       return salesData

    } catch (error) {
        
        console.log(`error while calculating the sales report`,error.message);

        return res.status(500).send("Internal server Error")
    
    }
}

















//loads the customer list with pagination
const loadCustomer = async (req, res) => {

    let pageNumber = parseInt(req.query.page) || 1;

    const perPageData = 5; 

    try {

        const totalUsers = await users.countDocuments();

        const totalPages = Math.max(1, Math.ceil(totalUsers / perPageData));

        pageNumber = Math.max(1, Math.min(pageNumber, totalPages));

        const skip = (pageNumber - 1) * perPageData;

        const userData = await users.find({})
            .skip(skip)
            .limit(perPageData)
            .sort({createdAt: -1})
            .exec();

        return res.status(200).render('admin/customerList', {
            userData: userData,
            totalPages: totalPages,
            currentPage: pageNumber
        });
    } catch (error) {
        console.log("Error while loading the customers:", error.message);
        return res.status(500).send("Internal Server Error");
    }
}
//block or unblocks a customer 
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

//loads the category and brand management page 
const loadCategoryBrand = async (req,res) =>{

    try {
 

        const categoriesData = await categories.find({}).sort({createdAt:-1}).exec()
        const brandsData = await brands.find({}).sort({createdAt:-1})

       return res.status(200).render('admin/brandCategoryManagement',{categoriesData,brandsData})


    } catch (error) {
        
        console.log(`cannot load the category page`,error.message);

        
        return res.status(500).send("Internal server Error")
    }
}

//add a new category or brand
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

//edits an existing category

const editCategory = async (req,res) =>{

  const { categoryId, name, description} = req.body; 

  console.log(`data from the backend`,categoryId,name,description);

    if (!categoryId ||!name ||!description) {

        return res.status(400).json({ success: false, message: "Category ID, name, and description are required" })

    }

    try {
        
        const category = await categories.findById({_id:categoryId})

        if(!category){

            return res.status(404).json({ success: false, message: "Category not found" });

        }

         const UpdatedCategory = await categories.findByIdAndUpdate({_id:categoryId},{$set:{name:name,description:description}})
   
        if(UpdatedCategory){

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

//edits an existing brand
 const editBrand = async (req,res) =>{

    const { brandId, name} = req.body; 

    console.log(`data from the backend`,brandId,name);

    if (!brandId ||!name) {

        return res.status(400).json({ success: false, message: "Brand ID and name are required" });
    }

    try {
        
        const brand = await brands.findById({_id:brandId})

        if(!brand){

            return res.status(404).json({ success: false, message: "Brand not found" });
        }

            const updatedBrand = await brands.findByIdAndUpdate({_id:brandId},{$set:{name:name}})

            if(updatedBrand){

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

 //soft deletes (blocks/unblocks) a category
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

// soft deletes (blocks/unblocks) a brand
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

const escapeRegExp = (string) => {

    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  };
  
//check existing category
const categoryExists = async (req, res) => {

    const { encodedCName } = req.query;

    const escapedCName = escapeRegExp(encodedCName);

    console.log('Entered in existing category checking function:', escapedCName);

    try {

        const exist = await categories.findOne({ name: { $regex: new RegExp(`^${escapedCName}`, 'i') } });

        if (exist) {

            return res.status(200).json({ message: "Category already exists", exists: true });

        }

        return res.status(200).json({ message: "Category does not exist", exists: false });
        
    } catch (error) {

        console.log('Error while checking the existing category:', error.message);

        return res.status(500).json({ message: 'Internal server error', error: error.message });

    }
}


//check existing brand
const brandExists = async(req,res) =>{

    const {encodedBName} = req.query

    const escapedBName = escapeRegExp(encodedBName);

    console.log('Entered in existing brand checking function:', escapedBName);

    try {

        const exists = await brands.findOne({name:{$regex: new RegExp(`^${escapedBName}`,'i')}})

        if(exists){

            return res.status(200).json({message:"Brand already exists",exists:true})

        }
        
        return res.status(200).json({message:"Brand does not exist",exists:false})

    } catch (error) {
        
        console.log(`error while checking the existing brand`,error.message);

        return res.status(500).json({message:'Internal server error',error:error.message})

    }
}

//loads the product list page
const loadProducts = async (req, res) => {

    let pageNumber = parseInt(req.query.page) || 1;

    const perPageData = 5; 

    try {
       
        const totalProducts = await products.countDocuments();
        const totalPages = Math.max(1, Math.ceil(totalProducts / perPageData));

        pageNumber = Math.max(1, Math.min(pageNumber, totalPages));

        const skip = (pageNumber - 1) * perPageData;

       
        const productData = await products.find({})
            .populate('brand')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(perPageData)
            .exec();

        const categoriesData = await categories.find({}).sort({ createdAt: -1 });

        return res.status(200).render("admin/productList", {
            productData: productData,
            categoriesData: categoriesData,
            totalPages: totalPages,
            currentPage: pageNumber
        });

    } catch (error) {
        console.log("Error while loading the products page:", error.message);
        return res.status(500).send("Internal Server Error");
    }
}

//loads the add product page
const loadaddProduct = async (req,res) =>{

    try {

        const categoriesData = await categories.find({isBlocked:false})
        const brandsData = await brands.find({isBlocked:false})

      return res.status(200).render("admin/addProduct",{categoriesData,brandsData})

    } catch (error) {

        console.log(`error while adding the product`,)
        
        return res.status(500).send("Internal server Error")
    }
}

//adds a new product
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
    
      return  res.status(200).redirect("/admin/addProducts")
        
    } catch (error) {
        
        console.log(`cannot add the products `,error.message);
          
        return res.status(500).send("Internal server Error")
    }
}


//soft deletes (blocks/unblocks) a product
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

//loads edit product page
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

//edit product
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

//edit product image
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

// const ProductExists = async (req,res) =>{

//     const {encodedPName} = req.query

//     console.log(`Entered in existing product checking function:`,encodedPName);

//     try {

//         const exists = await products.findOne({name:encodedPName})

//         if(exists){

//             return res.status(200).json({message:"Product already exists",exists:true})

//         }

//         return res.status(200).json({message:"Product does not exist",exists:false})
        
//     } catch (error) {
        
//         console.log(`error while checking the existing product`,error.message);

//         return res.status(500).json({message:"Internal server error",error:error.message})

//     }
    
// }



//loads the order list page
const loadOrderList = async (req, res) => {
    
    let pageNumber = parseInt(req.query.page) || 1;
    const perPageData = 5;

    try {
      
        const totalOrders = await orders.countDocuments();
        const totalPages = Math.max(1, Math.ceil(totalOrders / perPageData));

        pageNumber = Math.max(1, Math.min(pageNumber, totalPages));

        const skip = (pageNumber - 1) * perPageData;

       
        const orderData = await orders.find({})
            .populate("user")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(perPageData)
            .exec();

        return res.render("admin/orderList", {
            orderData: orderData,
            totalPages: totalPages,
            currentPage: pageNumber
        });

    } catch (error) {
        console.log("Error while listing the orders:", error.message);
        return res.status(500).send("Internal Server Error");
    }
}


//loads the order details page
const loadOrderDetailsPage = async (req, res) => {
    try {

        const { orderId } = req.query;

        console.log(`this is the order id coming from the front end`,orderId);

        const userOrderDataDetails = await orders.findOne({ _id:orderId }).populate("user")
        
        console.log(`this is the order details of that particular order`,userOrderDataDetails);

        return res.render("admin/orderDetailsPage", { userOrderDataDetails});

    } catch (error) {

        console.log(`Error while rendering the order details page`, error.message);

       return res.status(500).json({ message: "Internal Server Error" });

    }
};

//change the status of an order
const changeOrderStatus = async (req,res) =>{

    try {
        
        const { selectedStatus, orderId } = req.body

    
        const validStatuses = getEnumValues(orders.schema, 'orderStatus');

        
        if (!validStatuses.includes( selectedStatus)) {

          return res.status(400).json({ error: 'Invalid order status' });

        }
        
        const orderIdofTheCart = new ObjectId(orderId) 

        const order = await orders.findOne({_id:orderIdofTheCart})

        if(!order){

            console.log(`order cannot found`);

            return
        }

        const allItemsCancelled = order.items.every(item => item.orderProductStatus === "cancelled");

        if(!allItemsCancelled){


            order.items.forEach(item =>{

                if(item.orderProductStatus !=="cancelled"){
    
                    Object.assign(item,{orderProductStatus:selectedStatus})
                }
            })

            const updatedStatusPerItem = await order.save()

            if(updatedStatusPerItem){

                const updatedOrder = await orders.updateOne({_id:orderIdofTheCart},{$set:{orderStatus:selectedStatus}},{new:true})

                return res.status(200).json({message:"successfully changed the order status",success:true, updatedOrder: updatedOrder})

            }
        }else{

            return res.status(200).json({ message: "User cancelled all products", adminCannotCancel: true });

        }

         return res.status(400).json({
            message: "Order status unchanged",
            success: false
        });

    
    } catch (error) {
        
        console.log(`error while updating the order status`,error.message);

        return res.status(500).send("Internal server error");
    }
}

//checking the enum values in the data base
const getEnumValues = (schema, path) => {

    const enumValues = schema.path(path).enumValues;
    return enumValues;

  }
  
  
//coupon adding page loading
const loadCoupon = async (req, res) => {

    let pageNumber = parseInt(req.query.page) || 1;

    const perPageData = 5; 

    try {
        const totalCoupons = await coupons.countDocuments();
        const totalPages = Math.max(1, Math.ceil(totalCoupons / perPageData));

        pageNumber = Math.max(1, Math.min(pageNumber, totalPages));

        const skip = (pageNumber - 1) * perPageData;
        const couponsData = await coupons.find({})
            .skip(skip)
            .limit(perPageData)
            .sort({ createdAt: -1 })
            .exec();

        return res.status(200).render('admin/couponList', {
            couponsData: couponsData,
            totalPages: totalPages,
            currentPage: pageNumber
        });
    } catch (error) {
        console.log("Error while loading the coupons:", error.message);
        return res.status(500).send("Internal Server Error");
    }
}



const loadAddCoupon = async(req,res) =>{

    try {
        
        return res.status(200).render("admin/addCoupon")
    } catch (error) {
        
        console.log(`error while adding the coupon`,error.message);
    }
}

const addCoupon = async (req,res) =>{


    try {
        
        const {couponName,couponDescription,couponCode,couponDiscount,maxAmount,minAmount,couponStatus} = req.body
    
        console.log(`this is the coupon details`,couponName,couponDescription,couponCode,couponDiscount,maxAmount,minAmount,couponStatus);
    
    
        const coupon = new coupons({

            couponName:couponName,
            couponDescription:couponDescription,
            couponCode:couponCode,
            couponDiscount:couponDiscount,
            maxAmount:maxAmount,
            minAmount:minAmount,
            couponStatus:couponStatus
        })

        const couponData = coupon.save()
        if(couponData){

            return res.status(200).redirect("/admin/addCoupon")
        }

        return res.send("something went wrong")

    } catch (error) {
        
        console.log(`error while adding the coupon`,error.message);
    }
}



const loadReturnedOrder = async (req,res) =>{

    try {

        const returnedOrderData = await returnUserOrder.find({}).populate("userId").sort({createdAt:-1})
        
        
        return res.status(200).render("admin/returnedOrder",{returnedOrderData})

        
    } catch (error) {

        console.log(`error while loading the returned products `,error.message);
        
        
    }
}

const approveReturn = async (req, res) => {
    try {
        const { returnOrderDocId, status, addToInventory } = req.body;

        console.log(`this is the id and status from approved fn`, returnOrderDocId, status, addToInventory);

        const returnedOrderData = await returnUserOrder.findOne({ _id: returnOrderDocId });

        if (!returnedOrderData) {

            return res.status(404).json({ message: "Return order not found", success: false });
        }


       const { orderId, userId, productId, productRefundAmount: refundAmount } = returnedOrderData;


        const orderData = await orders.findOne({ _id: orderId });
        const walletData = await wallet.findOne({ userId: userId });

        
        const productToUpdate = orderData.items.find(product =>product.product.toString()===productId.toString())

        if (!productToUpdate) {

            return res.status(404).json({ message: "Product not found in the order", success: false });

        }

        const productStock = productToUpdate.quantity

        console.log(`Stock of the product (ID: ${productId}) in the order: ${productStock}`);

        returnedOrderData.returnProductStatus = "approved";
        await returnedOrderData.save();
 
        productToUpdate.orderProductStatus = "returnApproved"

        const allProductsInitiated = orderData.items.every(product => product.orderProductStatus=== "returnApproved");

        if(allProductsInitiated){

            orderData.orderStatus = "returnApproved"
        }

        await orderData.save()

        if(addToInventory){

            await products.findByIdAndUpdate(productId,{$inc:{stock:productStock}},{new:true})
        }

        if(orderData.paymentMethod==="razorPay"){

            const newWalletTransaction = {

                orderId:orderId,
                amount:refundAmount,
                type:"credit",
                walletTransactionStatus:"refunded"
            }

            await wallet.findOneAndUpdate(
                {userId:userId},
                {
                    $inc:{balance:refundAmount},
                    $push:{transactions:newWalletTransaction}
                },
                {new:true}
            )
        }

        return res.status(200).json({message:"Product return approved",success:true,returnApproved:true,updatedStatus: returnedOrderData.returnProductStatus})
        

    } catch (error) {

        console.error(`error while updating the order`, error.message);

        return res.status(500).json({ message: "Internal Server error", success: false });

    }
};



const rejectReturn = async (req,res) =>{

    try {
        
        const { returnOrderDocId, status, addToInventory } = req.body;
      
        console.log(`this is the id and status from approved fn`, returnOrderDocId, status, addToInventory);

        
        const returnedOrderData = await returnUserOrder.findOne({ _id: returnOrderDocId });

        if (!returnedOrderData) {

            return res.status(404).json({ message: "Return order not found", success: false });

        }


        const { orderId,productId} = returnedOrderData;

        const orderData = await orders.findOne({_id:orderId})

        const productToUpdate = orderData.items.find(product =>product.product.toString()===productId.toString())

        if(!productToUpdate){

            return res.status(404).json({message:"Product not found in the order",success:false})
        }

         returnedOrderData.returnProductStatus = "rejected";
        await returnedOrderData.save();

       productToUpdate.orderProductStatus = "returnRejected"

  
        const allProductsInitiated = orderData.items.every(product => product.orderProductStatus=== "returnRejected");

        if(allProductsInitiated){

            orderData.orderStatus = "returnRejected"
        }

        await orderData.save()
       
        return res.status(200).json({message:"Product return rejected",success:true,returnApproved:false,updatedStatus: returnedOrderData.returnProductStatus})

    } catch (error) {
        
        console.log(`error while updating the order`,error.message);
        
        return res.status(500).json({message:"Internal server error",success:false})

    }

}
module.exports = {

    //admin authentication

    loadLogin,
    registerAdmin,
    verifyAdmin,
    isSignout,

    // page loaders

    loadDashboard,
    loadCustomer,
    loadCategoryBrand,
    loadProducts,
    loadaddProduct,
    loadOrderList,
    loadOrderDetailsPage,
    loadEditProduct,
    loadCoupon,
    loadAddCoupon,

    // user management

    blockUnblock, 
   
    // category and brand management

    addCategoryBrand,
    editCategory,
    editBrand,
    softDeleteCategory,
    softDeleteBrand,
    categoryExists,
    brandExists,

    // product management

    addProduct,
    editProduct,
    editImage,
    softDeleteProduct,
    // ProductExists,
    
   // total order status management

    changeOrderStatus,
  
    //coupon management
    addCoupon,

   
    loadReturnedOrder,
    approveReturn,
    rejectReturn,

    //calculate sales report
    getSalesData,
    getSalesDataJson
  

}