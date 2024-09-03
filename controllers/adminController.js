const bcrypt = require('bcrypt');
const dayjs = require('dayjs');
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
const transactionOnline = require('../models/onlineTransactionModel')


const securePassword = async(password) =>{
    try {

        const passwordHash = await bcrypt.hash(password,10) 
        return passwordHash

    } catch (error) {

        console.log(`error in hashing the password`,error.message);
        
    }
}


const loadLogin = (req,res) =>{
    try {

       return  res.status(200).render('admin/signin')

    } catch (error) {

        console.log(`cannot load login page of the admin`,error.message);
        
        return res.status(500).render("admin/500")
    }
}


const registerAdmin = async (req,res) =>{

    const {fname,lname,email,password,phone} = req.body

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

        return res.status(500).render("admin/500")
        
    }
}


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
        
        return res.status(500).render("admin/500")
    }

}
 

const isSignout = async (req,res) =>{

    try {

        req.session.destroy()

       return res.status(200).redirect('/admin/signin')
        
    } catch (error) {
        
        console.log(`error while using the logging out function`,error.message);

        return res.status(500).render("admin/500")
    }

}


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

        return res.status(500).render("admin/500")

    }

   
}
//not checking the delivered orders getting all the order datas discounts

const overAllDiscount = async () =>{

    try {
        
        const orderList = await orders.find({})

        let subTotalAmountWithOutAnyOffer = 0;
        let totalAmountWithAllOfferApplied = 0;

        orderList.forEach(order => {
            order.items.forEach(item => {
                subTotalAmountWithOutAnyOffer += item.price;
            });
        });
         
        orderList.forEach(order => {

            totalAmountWithAllOfferApplied += order.totalAmount;
        });
       
        const totalDiscountAmount = subTotalAmountWithOutAnyOffer-totalAmountWithAllOfferApplied

        return totalDiscountAmount


    } catch (error) {
        
        console.log(`error while calculating the discount`,error.message);

        return res.status(500).render("admin/500")
        
    }
} 

//not checking the delivered orders getting all the order datas discounts
const overAllOrderAmount = async () =>{

    try {

        const ordersList = await orders.find({}, { totalAmount: 1 })

        const totalSalesAmount = ordersList.reduce((acc, order) => acc + order.totalAmount, 0)

        return totalSalesAmount
      

    } catch (error) {
        
        console.log(`error while calculating the overall sales amount`,error.message);

        return res.status(500).render("admin/500")
        
    }
}

//not checking the delivered orders getting all the order datas discounts
const totalSalesCount = async() =>{

    try {
        
       return await orders.countDocuments()

    } catch (error) {
        
        console.log(`error while calculating the sales count`,error.message);

        return res.status(500).render("admin/500")
        
    }
}

//not checking the delivered orders getting all the order datas discounts
const countTotalOrders = async () =>{

    try {

        return await orders.countDocuments();
        
    } catch (error) {
        
        console.log(`error while getting the total orders`,error.message);

        return res.status(500).render("admin/500")
        
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

        return res.status(500).render("admin/500")
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

                    const itemPrice = item.productSalesPriceAfterOfferDiscount > 0 ? item.productSalesPriceAfterOfferDiscount : item.price;

                    const itemTotalAmount = itemPrice*item.quantity

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
        
        return res.status(500).render("admin/500")
    }
}

const totalRevenue = async () =>{

    try {

        const allOrders = await orders.find({})

        let totalRev = 0

        allOrders.forEach(order => {

            order.items.forEach(item =>{

                if(item.orderProductStatus==="delivered"){

                    const itemPrice = item.productSalesPriceAfterOfferDiscount > 0 ? item.productSalesPriceAfterOfferDiscount : item.price;

                    const itemTotalAmount = itemPrice*item.quantity

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

        return res.status(500).render("admin/500")
        
    }

}

const getSalesDataJson = async (req,res) =>{

    try {
    
         const { dateFrom, dateTill, period } = req.query;

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

const getSalesData = async (startDate, endDate) => {
    try {
      const matchStage = { $match: { "items.orderProductStatus": "delivered" } };
      if (startDate && endDate) {
        matchStage.$match.orderDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      const pipeline = [
        matchStage,
        {
          $unwind: "$items"
        },
        {
          $match: {
            "items.orderProductStatus": "delivered"
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%d-%b-%Y", date: "$orderDate" } }
            },
            totalNumberOfOrders: { $sum: 1 },
            grossSales: {
              $sum: {
                $multiply: [
                  {
                    $cond: [
                      { $gt: ["$items.productSalesPriceAfterOfferDiscount", 0] },
                      "$items.productSalesPriceAfterOfferDiscount",
                      "$items.price"
                    ]
                  },
                  "$items.quantity"
                ]
              }
            },
            couponDeductions: {
              $sum: {
                $multiply: [
                  {
                    $divide: [
                      {
                        $multiply: [
                          {
                            $cond: [
                              { $gt: ["$items.productSalesPriceAfterOfferDiscount", 0] },
                              "$items.productSalesPriceAfterOfferDiscount",
                              "$items.price"
                            ]
                          },
                          "$items.quantity"
                        ]
                      },
                      "$subTotalAmount"
                    ]
                  },
                  "$discountAmount"
                ]
              }
            }
          }
        },
        {
          $project: {
            date: "$_id.date",
            totalNumberOfOrders: 1,
            grossSales: 1,
            couponDeductions: 1,
            netSales: { $subtract: ["$grossSales", "$couponDeductions"] }
          }
        }
      ];
      const salesData = await orders.aggregate(pipeline).exec();
      return salesData;
    } catch (error) {
      console.log(`error while calculating the sales report`, error.message);
      return res.status(500).render("admin/500")
    }
  };




const loadCustomer = async (req, res) => {
    const statusFilter = req.query.status;
    const searchQuery = req.query.search || '';
    let pageNumber = parseInt(req.query.page) || 1;

    const perPageData = 5;

    try {
        let query = {};

        if (searchQuery) {
            query.$or = [
                { fname: { $regex: searchQuery, $options: 'i' } },
                { lname: { $regex: searchQuery, $options: 'i' } },
                { email: { $regex: searchQuery, $options: 'i' } },
                {
                    $expr: {
                        $regexMatch: {
                            input: { $toString: "$phone" },
                            regex: searchQuery,
                            options: "i"
                        }
                    }
                }
            ];
        }

        if (statusFilter === 'Active') {
            query.isBlocked = false;
        } else if (statusFilter === 'Disabled') {
            query.isBlocked = true;
        }

        const totalUsers = await users.countDocuments(query);
        const totalPages = Math.max(1, Math.ceil(totalUsers / perPageData));

        pageNumber = Math.max(1, Math.min(pageNumber, totalPages));
        const skip = (pageNumber - 1) * perPageData;

        const userData = await users.find(query)
            .skip(skip)
            .limit(perPageData)
            .sort({ createdAt: -1 })
            .exec();

        return res.status(200).render('admin/customerList', {
            userData: userData,
            totalPages: totalPages,
            currentPage: pageNumber,
            statusFilter: statusFilter,
            search: searchQuery
        });
    } catch (error) {
        console.log("Error while loading the customers:", error.message);
        return res.status(500).render("admin/500")
    }
};



const blockUnblock = async (req,res) =>{
    const userId = req.query.userId
    try {
        const user = await users.findById(userId)

       
        if(!user){
            return res.status(404).render("user/404")
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

        return res.status(500).json({
            success:false,
            message:"error while blocking or unblocking the customer",
           
        })
    }
}


const loadCategoryBrand = async (req,res) =>{

    try {
 

        const categoriesData = await categories.find({}).sort({createdAt:-1}).exec()
        const brandsData = await brands.find({}).sort({createdAt:-1})

       return res.status(200).render('admin/brandCategoryManagement',{categoriesData,brandsData})


    } catch (error) {
        
        console.log(`cannot load the category page`,error.message);

        
        return res.status(500).render("admin/500")
    }
}

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

     return res.redirect("/admin/brandCategoryManagement")

    } catch (error) {

        console.log(`error adding the category`,error.message); 
        
        return res.status(500).render("admin/500")
        
    }    

   }else if(bName){

    try {

        const brand = new brands({

            name:bName.trim(),

        })

      const   brandData = await brand.save()

     return res.redirect("/admin/brandCategoryManagement")

    } catch (error) {

        console.log(`error adding the brand`,error.message); 
        
        return res.status(500).render("admin/500")
    }    

   }
     
     
   
}



const editCategory = async (req,res) =>{

  const { categoryId, name, description} = req.body; 


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
        
            return res.status(200).json({

                success:true,
                message:"category successfully edited",
                categoryDetails:UpdatedCategory

            })

        }

    } catch (error) {

        console.log(`error while editing the category`,error.message);

        return res.status(500).json({

            success:false,
            message:"error while editing the category",
     
        })

        
    }
}


 const editBrand = async (req,res) =>{

    const { brandId, name} = req.body; 

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
        
        return res.status(500).json({

            success:false,
            message:"error while editing the brand",
     
        })
    }

 }

 
const softDeleteCategory = async (req,res) =>{

    const categoryId = req.query.categoryId


    try {
        
        const category = await categories.findById({_id:categoryId})
        
        if(!category){

            return res.status(404).json({ success: false, message: "Category not found" });
        }
        
        if(category.isBlocked){

         const UpdatedCategory = await categories.findByIdAndUpdate({_id:categoryId},{$set:{isBlocked:false}},{new:true})

            return res.status(200).json({

                success:true,
                message:"category successfully soft deleted",
                categoryId:UpdatedCategory

            })

        }else{

        const UpdatedCategory =  await categories.findByIdAndUpdate({_id:categoryId},{$set:{isBlocked:true}},{new:true})

            return res.status(200).json({

                success:true,
                message:"undone category soft deletion",
                categoryId:UpdatedCategory

            })
        }


    } catch (error) {

        console.log(`error while deleting the category`,error.message)

          
        return res.status(500).json({

            success:false,
            message:"error while  deleting the category",
         
        })
        
        
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


            return res.status(200).json({

                success:true,
                message:"brand successfully soft deleted",
                brandId:updatedBrand
            })
        }else{

            const updatedBrand = await brands.findByIdAndUpdate({_id:brandId},{$set:{isBlocked:true}},{new:true})


            return res.status(200).json({

                success:true,
                message:"undone brand soft deletion",
                brandId:updatedBrand
            })
        }
        
    } catch (error) {
        
        console.log(`error while deleting the brand`,error.message);

          
        return res.status(500).json({
            success:false,
            message:"error while deleting the brand",
           
        })
    }

}

const escapeRegExp = (string) => {

    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  };
  

const categoryExists = async (req, res) => {

    const { encodedCName,categoryId } = req.query;
    
    const decodedCName = decodeURIComponent(encodedCName)
    const escapedCName = escapeRegExp(decodedCName);
    
    try {

        const query = { name: { $regex: new RegExp(`^${escapedCName}`, 'i') } }

        if(categoryId){

            query._id = {$ne : categoryId}
        }

        const exist = await categories.findOne(query);


        if (exist) {

            return res.status(200).json({ message: "Category already exists", exists: true });

        }

        return res.status(200).json({ message: "Category does not exist", exists: false });
        
    } catch (error) {

        console.log('Error while checking the existing category:', error.message);

        return res.status(500).json({ message: 'Internal server error'});

    }
}



const brandExists = async(req,res) =>{

    const {encodedBName,brandId } = req.query

    const escapedBName = escapeRegExp(encodedBName);

    try {

        const query = { name: { $regex: new RegExp(`^${escapedBName}`, 'i') } }

        if (brandId) {

            query._id = { $ne: brandId }; 

        }
        
        const exists = await brands.findOne(query);

        if(exists){

            return res.status(200).json({message:"Brand already exists",exists:true})

        }
        
        return res.status(200).json({message:"Brand does not exist",exists:false})

    } catch (error) {
        
        console.log(`error while checking the existing brand`,error.message);

        return res.status(500).json({message:'Internal server error'})

    }
}


const loadProducts = async (req, res) => {
    let pageNumber = parseInt(req.query.page) || 1;
    const perPageData = 5;

    const categoryFilter = req.query.category || '';
    const brandFilter = req.query.brand || '';       
    const statusFilter = req.query.status || '';     
    const searchTerm = (req.query.searchTerm || '').trim();

    try {
       
        let query = {};

        if (categoryFilter) {
            query.category = categoryFilter;
        }

        if (brandFilter) {
            query.brand = brandFilter;
        }

        if (statusFilter === 'inStock') {
            query.stock = { $gt: 0 };
        } else if (statusFilter === 'outOfStock') {
            query.stock = { $eq: 0 };
        } else if (statusFilter === 'unListed') {
            query.isBlocked = true; 
        }

        if (searchTerm) {
            query.name = { $regex: searchTerm, $options: 'i' };
        }

     
        const totalProducts = await products.countDocuments(query);
        const totalPages = Math.max(1, Math.ceil(totalProducts / perPageData));

        pageNumber = Math.max(1, Math.min(pageNumber, totalPages));
        const skip = (pageNumber - 1) * perPageData;

        
        const productData = await products.find(query)
            .populate('brand')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(perPageData)
            .exec();

        const categoriesData = await categories.find({}).sort({ createdAt: -1 });
        const brandsData = await brands.find({}).sort({ createdAt: -1 });

        return res.status(200).render("admin/productList", {
            productData: productData,
            categoriesData: categoriesData,
            brandsData: brandsData,
            totalPages: totalPages,
            currentPage: pageNumber,
            categoryFilter: categoryFilter,
            brandFilter: brandFilter,
            statusFilter: statusFilter,
            searchTerm: searchTerm
        });

    } catch (error) {
        console.log("Error while loading the products page:", error.message)

        return res.status(500).render("admin/500")
    }
};





const loadaddProduct = async (req,res) =>{

    try {

        const categoriesData = await categories.find({isBlocked:false})
        const brandsData = await brands.find({isBlocked:false})

      return res.status(200).render("admin/addProduct",{categoriesData,brandsData})

    } catch (error) {

        console.log(`error while loading add product page `,)
        
        return res.status(500).render("admin/500")
    }
}


const addProduct = async (req,res) =>{

    try {

        const {name,brand,category,dialShape,displayType,salesPrice,strapMaterial,strapColor,stock,description,targetGroup} = req.body

        const brandFromcollection = await brands.find({name:brand})
        
        const categoryFromcollection = await categories.find({name:category})

        const product = new products({
    
            name:name,
            brand:brandFromcollection[0]._id,
            category:categoryFromcollection[0]._id,
            dialShape:dialShape,
            displayType:displayType,
            salesPrice:salesPrice,
            strapMaterial:strapMaterial,
            strapColor:strapColor,
            stock:stock,
            description:description,
            targetGroup:targetGroup,
            images: req.files //converting it to array because its 4 images
        })
    
        const productData = await product.save()
    
      return  res.status(200).json({message:"Product upload successfully",success:true})
        
    } catch (error) {
        
        console.log(`cannot add the products `,error.message);
          
        return res.status(500).json({ message: "Error while uploading products", success: false });
    }
}



const softDeleteProduct = async (req,res) =>{

    const productId = req.query.productId 

    try {

        const productData = await products.findById({_id:productId})

        if(!productData){

            return res.status(404).json({ success: false, message: "Product not found" });

        }

        if(productData.isBlocked){

            const updatedProduct = await products.findByIdAndUpdate({_id:productId},{$set:{isBlocked:false}},{new:true})

      

            return res.status(200).json({

                success:true,
                message:"product successfully soft deleted",
                productId:updatedProduct
            })
        }else{

            const updatedProduct = await products.findByIdAndUpdate({_id:productId},{$set:{isBlocked:true}},{new:true})

            
       

            return res.status(200).json({

                success:true,
                message:"undone product soft deletion",
                productId:updatedProduct
            })
        }
        
    } catch (error) {
        
        console.log(`error while deleting the product`,error.message);

          
        return res.status(500).json({

            success:false,
            message:"error while deleting the product",
        })
    }

}


const loadEditProduct = async (req,res) =>{

    try {

        const {productId} = req.query

        const categoriesData = await categories.find({})

        const brandsData = await brands.find({})

        const productDataToEdit = await products.findOne({_id:productId}).populate('category').populate('brand')

        return res.status(200).render("admin/editProduct",{categoriesData,brandsData,productDataToEdit})
        
    } catch (error) {
        
        console.log(`error while loading the edit product page`,error.message);

        return res.status(500).render("admin/500")
    }
}


const editProduct = async (req, res) => {
    try {

      
        const { productId,name,brand,category,dialShape,displayType,salesPrice,strapMaterial,strapColor,stock,description,targetGroup } = req.body;

        const images = req.files

        const existingProduct = await products.findById(productId);

        if (!existingProduct) {

            return res.status(404).json({ message: "Product not found", success: false });

        }

        const updatedData = { name,brand,category,dialShape,displayType,salesPrice,strapMaterial,strapColor,stock,description,targetGroup};

        const updatedProductDetails = await products.findByIdAndUpdate(productId,{ $set: updatedData },{ new: true });
        
        if (!updatedProductDetails) {

            return res.status(404).json({ message: "Product cannot be updated" ,success:false,updatedProductName:updatedProductDetails.name});
        }

        
        if(images&&images.length>0){

           await products.findByIdAndUpdate(productId,{$push:{images:{$each:images}}},{new:true})
        }
        
        return res.status(200).json({ message: "Product updated successfully",success:true,updatedProductName:updatedProductDetails.name });

    } catch (error) {

        console.log(`Error while editing the product data:`, error.message);

        return res.status(500).json({ message: "Failed to update product", success:false });
    }
}


const editImage = async (req,res) =>{

    try {

        const { productId,imageName} = req.body;

           if (productId&&imageName) {

            await products.updateOne({ _id: productId },{ $pull: { images: { filename:imageName } } });

            return res.status(200).json({ message: "Product Image successfully removed",success:true });

        }


          return res.status(400).json({ message: "Failed to remove product image",success:false });
      

        
    } catch (error) {
        
        console.log(`error while removing the image`,error.message);

        return res.status(500).json({ message: "Failed to update product image", success:false });
    }
}

const ProductExists = async (req,res) =>{

    const {encodedPName,productId} = req.query

    try {


         const query = { name: encodedPName }

         if (productId) {

            query._id = { $ne: productId }

        }

        const exists = await products.findOne(query)

        if(exists){

            return res.status(200).json({message:"Product already exists",exists:true})

        }

        return res.status(200).json({message:"Product does not exist",exists:false})
        
    } catch (error) {
        
        console.log(`error while checking the existing product`,error.message);

        return res.status(500).json({message:"Internal server error"})

    }
    
}


const loadOrderList = async (req, res) => {
    const statusFilter = req.query.status || ''; 
    const searchQuery = req.query.search || '';
    let pageNumber = parseInt(req.query.page) || 1;
    const perPageData = 5;

    try {
        let query = {};
        let searchNumber = undefined;
        if (!isNaN(searchQuery) && searchQuery.trim() !== '') {
            searchNumber = parseInt(searchQuery);
        }
    
      
        if (searchQuery) {
            query.$or = [
                { 'user.fname': { $regex: searchQuery, $options: 'i' } },
                { 'user.lname': { $regex: searchQuery, $options: 'i' } },
                { 'user.email': { $regex: searchQuery, $options: 'i' } },
                { 'shippingAddress.name': { $regex: searchQuery, $options: 'i' } },
                { 'shippingAddress.phone': searchNumber },
                { 'shippingAddress.locality': { $regex: searchQuery, $options: 'i' } },
                { 'shippingAddress.address': { $regex: searchQuery, $options: 'i' } },
                { 'shippingAddress.cityDistTown': { $regex: searchQuery, $options: 'i' } },
                { 'shippingAddress.state': { $regex: searchQuery, $options: 'i' } },
                { 'shippingAddress.pincode':  searchNumber  },
                { 'items.productName': { $regex: searchQuery, $options: 'i' } },
                { 'items.brandName': { $regex: searchQuery, $options: 'i' } },
                { 'items.categoryName': { $regex: searchQuery, $options: 'i' } }
            ];
        }

       
        if (statusFilter) {

            query.orderStatus = statusFilter;
        }

        const totalOrders = await orders.countDocuments(query);
        const totalPages = Math.max(1, Math.ceil(totalOrders / perPageData));

        pageNumber = Math.max(1, Math.min(pageNumber, totalPages));
        const skip = (pageNumber - 1) * perPageData;

        const orderData = await orders.find(query)
            .populate("user")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(perPageData)
            .exec();

        return res.status(200).render('admin/orderList', {
            orderData: orderData,
            totalPages: totalPages,
            currentPage: pageNumber,
            statusFilter: statusFilter, 
            search: searchQuery
        });
    } catch (error) {
        console.log("Error while loading the orders:", error.message);

        return res.status(500).render("admin/500")
        
    }
};


const loadOrderDetailsPage = async (req, res) => {
    try {

        const { orderId } = req.query;

        const userOrderDataDetails = await orders.findOne({ _id:orderId }).populate("user")
        const transactionDetailsOftheOnlinePaymentOrder = await transactionOnline.findOne({orderId:orderId})

        return res.render("admin/orderDetailsPage", { userOrderDataDetails,transactionDetailsOftheOnlinePaymentOrder});

    } catch (error) {

        console.log(`Error while rendering the order details page`, error.message);

       return res.status(500).render("admin/500")

    }
};


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

            return res.status(400).json({message:"Order not found"})
        }

        const allItemsCancelled = order.items.every(item => item.orderProductStatus === "cancelled");

        if(!allItemsCancelled){


            order.items.forEach(item =>{

                if(item.orderProductStatus !=="cancelled"){
    
                    Object.assign(item,{orderProductStatus:selectedStatus})
                }
            })

            const updatedStatusPerItem = await order.save()

            let updatedOrder

            if(updatedStatusPerItem){

                 updatedOrder = await orders.updateOne({_id:orderIdofTheCart},{$set:{orderStatus:selectedStatus}},{new:true})

            }

            if(order.paymentMethod==="razorPay"||order.paymentMethod==="wallet"){

                const walletData = await wallet.findOne({userId:order.user})

                if (!walletData) {

                    return res.status(400).json({ message: "This user doesn't have any wallet" });
                }

                const productsAmountThatHaventRefunded  = walletData.transactions
                      
                     .filter(tx => tx.type==="credit"&&tx.orderId.equals(orderIdofTheCart))
                     .reduce((acc,tx) => acc+tx.amount,0 )

                     const refundAmount = order.totalAmount - productsAmountThatHaventRefunded

                     const newWalletTransaction = {

                        orderId:orderIdofTheCart,
                        amount:refundAmount,
                        type:"credit",
                        walletTransactionStatus:"refunded"

                     }

                     await wallet.findOneAndUpdate(

                        {userId:order.user},
                        {$inc:{balance:refundAmount},$push:{transactions:newWalletTransaction}},
                        {new:true}
                     )
                     
                     return res.status(200).json({message:"successfully changed the order status",success:true, updatedOrder: updatedOrder})

            }

            return res.status(200).json({message:"successfully changed the order status",success:true, updatedOrder: updatedOrder})

        }else{

            return res.status(200).json({ message: "User cancelled all products", adminCannotCancel: true });

        }
    
    } catch (error) {
        
        console.log(`error while updating the order status`,error.message);

        return res.status(500).json({
            message: "error while updating the order status",
            success: false
        });
    }
}


const getEnumValues = (schema, path) => {

    const enumValues = schema.path(path).enumValues;
    return enumValues;

}
  
  

const loadCoupon = async (req, res) => {
    let pageNumber = parseInt(req.query.page) || 1;
    const perPageData = 5;

    const searchQuery = req.query.search || '';
    const statusFilter = req.query.status || '';  

    try {
        const query = {};

        if (searchQuery) {
            query.$or = [
                { couponName: { $regex: searchQuery, $options: 'i' } },
                { couponCode: { $regex: searchQuery, $options: 'i' } },
            ];
        }

    
        if (statusFilter) {
            if (statusFilter === 'Active') {
                query.couponStatus = true;
            } else if (statusFilter === 'Inactive') {
                query.couponStatus = false;
            }
        }

        const totalCoupons = await coupons.countDocuments(query);
        const totalPages = Math.max(1, Math.ceil(totalCoupons / perPageData));

        pageNumber = Math.max(1, Math.min(pageNumber, totalPages));

        const skip = (pageNumber - 1) * perPageData;
        const couponsData = await coupons.find(query)
            .skip(skip)
            .limit(perPageData)
            .sort({ createdAt: -1 })
            .exec();

        return res.status(200).render('admin/couponList', {
            couponsData: couponsData,
            totalPages: totalPages,
            currentPage: pageNumber,
            search: searchQuery,   
            statusFilter: statusFilter  
        });
    } catch (error) {
        console.log("Error while loading the coupons:", error.message);
        return res.status(500).render("admin/500")
    }
}




const loadAddCoupon = async(req,res) =>{

    try {
        
        return res.status(200).render("admin/addCoupon")

    } catch (error) {
        
        console.log(`error while adding the coupon`,error.message);
        return res.status(500).render("admin/500")
    }
}

const addCoupon = async (req,res) =>{


    try {
        
        const {couponName,couponDescription,couponCode,couponDiscount,maxAmount,minAmount,couponStatus} = req.body
        
    
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

        return res.status(500).render("admin/500")

    } catch (error) {
        
        console.log(`error while adding the coupon`,error.message);

        return res.status(500).render("admin/500")
    }
}

const activateDeactivateCoupon = async (req,res) =>{

    const couponId = req.query.couponId   

    try {

        const couponData = await coupons.findById(couponId)

        if(!couponData){

            return res.status(404).json({ success: false, message: "Coupon not found" });

        }

        if(couponData.couponStatus){

            const updatedCouponStatus = await coupons.findByIdAndUpdate({_id:couponId},{$set:{couponStatus:false}},{new:true})
            
            return res.status(200).json({
                success:true,
                message:"coupon status set to false",
                couponId:updatedCouponStatus
            })
     
        }else{

            const updatedCouponStatus = await coupons.findByIdAndUpdate({_id:couponId},{$set:{couponStatus:true}},{new:true})
         
            return res.status(200).json({
                success:true,
                message:"coupon status set to true",
                couponId:updatedCouponStatus
            })
            
        }
        
    } catch (error) {
        
        console.log(`error while while blocking or unblocking the coupon`,error.message);
        return res.status(500).json({

            success:false,
            message:"error while updating the coupon status",
           
        })
        
    }
}

const loadReturnedOrder = async (req, res) => {
    try {
        let pageNumber = parseInt(req.query.page) || 1;
        const perPageData = 5;

        const searchQuery = req.query.search || '';
        const statusFilter = req.query.statusFilter || '';

        const query = {};

        if (searchQuery) {
            const isValidObjectId = ObjectId.isValid(searchQuery);
            if (isValidObjectId) {
                const searchObjectId = new ObjectId(searchQuery);
                query.$or = [
                    { orderId: searchObjectId },
                    { userId: searchObjectId },
                    { productId: searchObjectId }
                ];
            } else {
                query.$or = [
                    { productReturnReason: { $regex: new RegExp(searchQuery, 'i') } },
                   
                ];
            }
        }

      
        if (statusFilter) {

            query.returnProductStatus = statusFilter.toLowerCase();

        }

       
        const totalReturnedOrders = await returnUserOrder.countDocuments(query);
        const totalPages = Math.max(1, Math.ceil(totalReturnedOrders / perPageData));

        pageNumber = Math.max(1, Math.min(pageNumber, totalPages));

        const skip = (pageNumber - 1) * perPageData;
        const returnedOrderData = await returnUserOrder.find(query)
            .populate("userId")
            .skip(skip)
            .limit(perPageData)
            .sort({ createdAt: -1 })
            .exec();

        return res.status(200).render('admin/returnedOrder', {
            returnedOrderData,
            totalPages,
            currentPage: pageNumber,
            search: searchQuery,
            statusFilter
        });
    } catch (error) {
        console.log(`Error while loading returned orders:`, error.message);
        return res.status(500).render("admin/500")
    }
};


const approveReturn = async (req, res) => {
    try {
        const { returnOrderDocId, status, addToInventory } = req.body;


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

const bestSellers = async(req,res) =>{

    try {
        
        const type = req.query.type;

        if (type === 'product') {
          
        const topTenBestSellingProducts = await orders.aggregate([

            {$match:{orderStatus:"delivered"}},
            {$unwind:"$items"},
            {$match:{"items.orderProductStatus":"delivered"}},
            {

                $group:{

                    _id:"$items.product",
                    totalSold:{$sum:"$items.quantity"},
                    productName:{$first:"$items.productName"}
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },

            { $unwind: "$productDetails" },

            {
                $project: {
                    _id: 0,
                    productName: 1,
                    totalSold: 1,
                    price: "$productDetails.salesPrice",
                    firstImage: { $first: "$productDetails.images" },
                }
            },
            {$sort:{totalSold:-1}},
            {$limit:10}
        ])
        

        return res.render("admin/productBestSelling",{topTenBestSellingProducts:topTenBestSellingProducts})
 
        } else if (type === 'category') {

    

            const topTenBestSellingCategory = await orders.aggregate([

                
                    {$match:{orderStatus:"delivered"}},
                    {$unwind:"$items"},
                    {$match:{"items.orderProductStatus":"delivered"}},
                    {
                        $group:{

                            _id: { category: "$items.category", product: "$items.productName" },

                            totalSold: { $sum: "$items.quantity" },

                        }
                    },
                    {
                        $sort: { totalSold: -1 } 
                    },
                    {
                        $group:{

                            _id:"$_id.category",
                            topProduct: { $first: "$_id.product" },
                            totalSold: { $first: "$totalSold" },
                            totalItemsSold: { $sum: "$totalSold" }, 
                            totalOrders: { $sum: 1 }
                        }
                    },
                    { $lookup: {
                        from: "categories",
                        localField: "_id",
                        foreignField: "_id",
                        as: "categoryDetails"
                               }
                    },
                    { $unwind: "$categoryDetails" },
                    {
                        $project: {
                            _id: 0,
                            categoryName: "$categoryDetails.name",
                            totalItemsSold: 1,
                            totalOrders: 1,
                            topProduct: 1
                        }
                    },
                    { $sort: { totalItemsSold: -1 } },

                    { $limit: 10 }
                
            ])

        return res.render("admin/categoryBestSelling",{topTenBestSellingCategory:topTenBestSellingCategory})
          
        } else {

    

        const topTenBestSellingBrand = await orders.aggregate([

            {$match:{orderStatus:"delivered"}},
            {$unwind:"$items"},
            {$match:{"items.orderProductStatus":"delivered"}},
            {

                $group:{

                    _id:{ brand :"$items.brand",product:"$items.productName"},

                    totalSold:{$sum:"$items.quantity"},

                }

            },
            {
                $sort:{totalSold:-1}
            },
            {
                $group:{
                    _id:"$_id.brand",
                    topProduct:{$first:"$_id.product"},
                    totalSold:{$first:"$totalSold"},
                    totalItemsSold:{$sum:"$totalSold"},
                    totalOrders:{$sum:1}
                }
            },
            {
                $lookup:{

                    from:"brands",
                    localField:"_id",
                    foreignField:"_id",
                    as:"brandDetails"
                }
            },
            {$unwind:"$brandDetails"},
            {
                $project:{
                    _id:0,
                    brandName:"$brandDetails.name",
                    totalItemsSold:1,
                    totalOrders:1,
                    topProduct:1
                }
            },

            {$sort:{totalItemsSold:-1}},
            {$limit:10}

        ])
         
        return res.render("admin/brandBestSelling",{topTenBestSellingBrand:topTenBestSellingBrand})

        }

    } catch (error) {
        
        console.log(`error while finding the best sellers`,error.message);

        return res.status(500).render("admin/500")
        
    }

}


const loadCategoryOffer = async (req, res) => {
    let pageNumber = parseInt(req.query.page) || 1;
    const perPageData = 5;
    try {
        
        const totalOfferAppliedCategories = await categories.countDocuments({ "categoryOffer.offerName": { $exists: true } });
        
       
        const totalPages = Math.max(1, Math.ceil(totalOfferAppliedCategories / perPageData));
        
        
        pageNumber = Math.max(1, Math.min(pageNumber, totalPages));
        
      
        const skip = (pageNumber - 1) * perPageData;

        
        const offerAppliedCategories = await categories.find({ "categoryOffer.offerName": { $exists: true } })
            .sort({ createdAt: -1 }) 
            .skip(skip)
            .limit(perPageData)
            .exec();

      
        return res.status(200).render("admin/categoryOfferList", {
            offerAppliedCategories: offerAppliedCategories,
            totalPages: totalPages,
            currentPage: pageNumber
        });

    } catch (error) {
        console.log(`Error while loading the offer applying to category page:`, error.message);
      return res.status(500).render("admin/500")
    }
};

const loadAddCategoryOffer = async (req,res) =>{

    try {
        const currentDate = new Date();
        const categoriesWithProducts = await products.distinct('category')

        console.log(categoriesWithProducts);
        
        const categoriesData= await categories.find({$or: [
            
            { "categoryOffer.offerExpiryDate": { $lt: currentDate } },  { "categoryOffer": { $exists: false } }], _id: { $in: categoriesWithProducts }})

        return res.status(200).render("admin/addCategoryOffer",{categoriesData:categoriesData})


    } catch (error) {
        
        console.log(`error while loading the offer applying to category page`,error.message)
        return res.status(500).render("admin/500")
    }

}
const addCategoryOffer = async (req,res) =>{

    try {

        const {offerName, category, discountPercentage, startDate, expiryDate} = req.body


        if (!offerName || !category || !discountPercentage || !startDate || !expiryDate ) {

            return res.status(400).json({success:false,message:"All fields are required"});
        }

        const categoryId = new ObjectId(category)

        const categoryData = await categories.findById(categoryId)

        if(!categoryData){

            return res.status(404).json({success:false,message:"Category not found"});

        }

        const productsData= await products.find({category:categoryId})

        if(!productsData){

            return res.status(400).json({success:false,message:"Sorry no products are found in this category"});

        }
        
        const updatedCategory = await categories.findByIdAndUpdate(

            {_id:categoryId},
            {
                $set:{

                    "categoryOffer.offerName":offerName,
                    "categoryOffer.offerDiscountPercentage": discountPercentage,
                    "categoryOffer.offerStartDate": startDate,
                    "categoryOffer.offerExpiryDate":expiryDate,
                    "categoryOffer.offerStatus": true 
                }
            },
            {new:true}
        )

        productsData.forEach( async (product)=>{

            const originalPriceOfTheProduct = product.salesPrice
            const newDiscountedPriceAfterApplyingCategoryOffer = originalPriceOfTheProduct - (originalPriceOfTheProduct * (discountPercentage / 100))

            if(product.productSalesPriceAfterOfferDiscount > newDiscountedPriceAfterApplyingCategoryOffer){

                await products.findByIdAndUpdate(

                    {_id:product._id},
                    {
                        $set:{

                            "productSalesPriceAfterOfferDiscount":newDiscountedPriceAfterApplyingCategoryOffer,
                            "productOffer.offerDiscountPercentage":discountPercentage,
                            "productOffer.offerStartDate": startDate,
                            "productOffer.offerExpiryDate":expiryDate,
                            "productOffer.offerStatus":true
                        }
                    }

                    ,
                  
                )
            }



        })

        return res.status(200).json({success:true,message:"Category Offer added successfully"})
      
    } catch (error) {
        
        console.log(`error while adding offer to category`,error.message);
        
        return res.status(500).json({message:"Internal server error"})
    }
}

const activateDeactivateCategoryOffer = async (req,res) =>{

    try {

        const categoryId = req.query.categoryId


        const categoryData = await categories.findById(categoryId)

        if(!categoryData){

            return res.status(404).json({success:false,message:"Category not found"})

        }

        const newOfferStatus = !categoryData.categoryOffer.offerStatus

       const updatedCategoryOfferStatus = await categories.findByIdAndUpdate(
            categoryId,
            { "categoryOffer.offerStatus": newOfferStatus },
            { new: true }
        );
        
        const productsInCategory = await products.find({ category: categoryId })

        for(const product of productsInCategory){

            let s = product.salesPrice;
            let d = (categoryData.categoryOffer.offerDiscountPercentage / 100) * s
            let v = s - d
            
            if(v === product.productSalesPriceAfterOfferDiscount){

                await products.findByIdAndUpdate(
                    product._id,
                    {

                        "productOffer.offerStatus":newOfferStatus

                    },
                    { new: true }
                );
            }
        }
    
        return res.status(200).json({
            success: true,
            message: `Category offer status set to ${newOfferStatus}`,
            updatedCategoryOfferStatus: updatedCategoryOfferStatus
        });
    } catch (error) {
        
        console.log(`error while changing the status of the category offer`,error.message)
        return res.status(500).json({
            success: true,
             message:"Internal server error"
        });

    }
}

const loadEditCategoryOffer = async (req,res) =>{

    try {

        const { categoryId } = req.query

        const categoryData = await categories.findOne({_id:categoryId})
        

        return res.status(200).render("admin/editCategoryOffer",{categoryData:categoryData})
        
    } catch (error) {
        
        console.log(`error while loading the editing page of the category offer`,error.message);
        return res.status(500).render("admin/500")
    }

}

const editCategoryOffer = async (req,res) =>{

    try {

        const {categoryId,offerName,discountPercentage, expiryDate} = req.body

        
        if (!categoryId || !offerName || !discountPercentage || !expiryDate) {

            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const categoryData = await categories.findById(categoryId)
        
        if(!categoryData){

          return  res.status(404).json({success:false,message:"Category not found"})
        }

        const productsData = await products.find({ category: categoryId });

        if (!productsData.length) {

            return res.status(400).json({ success: false, message: "No products found in this category" });

        }

        const updatedCategory = await categories.findByIdAndUpdate(
            { _id: categoryId },
            {
                $set: {
                    "categoryOffer.offerName": offerName,
                    "categoryOffer.offerDiscountPercentage": discountPercentage,
                    "categoryOffer.offerExpiryDate": expiryDate,
                }
            },
            { new: true }
        );
        productsData.forEach(async (product) => {
            const originalPriceOfTheProduct = product.salesPrice;
            const newDiscountedPriceAfterApplyingCategoryOffer = originalPriceOfTheProduct - (originalPriceOfTheProduct * (discountPercentage / 100));

            if (product.productSalesPriceAfterOfferDiscount > newDiscountedPriceAfterApplyingCategoryOffer) {
                await products.findByIdAndUpdate(
                    { _id: product._id },
                    {
                        $set: {
                            "productSalesPriceAfterOfferDiscount": newDiscountedPriceAfterApplyingCategoryOffer,
                            "productOffer.offerDiscountPercentage":discountPercentage,
                            "productOffer.offerExpiryDate":expiryDate,

                        }
                    }
                );
            }
        });

        return res.status(200).json({ success: true, message: "Category offer edited successfully" });

    } catch (error) {
        
        console.log(`error while editing the category offer`,error.message);
        return res.status(500).json({ message: "An error occured while editing the category offer" });
        
    }
}



const loadProductOffer = async (req, res) => {
    let pageNumber = parseInt(req.query.page) || 1;
    const perPageData = 5;

    try {
        const totalOfferAppliedProducts = await products.countDocuments({ 'productOffer.offerDiscountAmount': { $exists: true } });
        const totalPages = Math.max(1, Math.ceil(totalOfferAppliedProducts / perPageData));

        pageNumber = Math.max(1, Math.min(pageNumber, totalPages));
        const skip = (pageNumber - 1) * perPageData;

        const offerAppliedProducts = await products.find({ 'productOffer.offerDiscountAmount': { $exists: true } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(perPageData)
            .exec();

        return res.status(200).render("admin/productOfferList", {
            offerAppliedProducts: offerAppliedProducts,
            totalPages: totalPages,
            currentPage: pageNumber
        });

    } catch (error) {
        console.log(`Error while loading the offer applied products page:`, error.message);
        return res.status(500).render("admin/500")
    }
};

const loadAddProductOffer = async (req,res) =>{

    try {
        const currentDate = new Date();
        const productsData = await products.find({$or:[
            {"productOffer.offerExpiryDate":{$lt :currentDate }},{"productOffer":{$exists : false}}
        ]})

        return res.status(200).render("admin/addProductOffer",{productsData:productsData})


    } catch (error) {
        
        console.log(`error while loading the offer applying to category page`,error.message);

        return res.status(500).render("admin/500")
    }

}
const addProductOffer = async (req,res) =>{

    try {

        const { offerName, product, discountPercentage, startDate, expiryDate} = req.body;


        if (!offerName || !product || !discountPercentage || !startDate || !expiryDate) {

            return res.status(400).json({success:false,message:"All fields are required"});

        }
        const productId = new ObjectId(product)
       
        const productData = await products.findById(productId)

        if(!productData){

            return res.status(404).json({success:false,message:"Product not found"});

        }

        const categoryData = await categories.findOne({_id:productData.category})

        if(!categoryData){

            return res.status(404).json({success:false,message:"No category found with the associated product for checking which offer is better"})

        }



        if(discountPercentage<=categoryData?.categoryOffer?.offerDiscountPercentage && new Date(categoryData?.categoryOffer?.offerExpiryDate) > new Date()){

            
           return res.status(200).json({ BetterOfferApplied:true, message: "product already has a better offer and is not expired"})


        }

        const discountAmount = (productData.salesPrice * discountPercentage) / 100;

        const updatedProduct = await products.findOneAndUpdate(
            { _id: productId },
            {
                $set: {
                    'productOffer.offerName': offerName,
                    'productOffer.offerDiscountPercentage': discountPercentage,
                    'productOffer.offerDiscountAmount': discountAmount,
                    'productOffer.offerStartDate': startDate,
                    'productOffer.offerExpiryDate': expiryDate,
                    'productOffer.offerStatus':true,
                    productSalesPriceAfterOfferDiscount: productData.salesPrice - discountAmount
                }
            },

            { new: true }
        );
           
 

     return res.status(200).json({success:true,message:"Product Offer added successfully"})
      
        
    } catch (error) {
        
        console.log(`error while adding offer to product`,error.message);
        
        return res.status(500).json({message:"Internal server error"})
    }
}
const activateDeactivateProductOffer = async (req,res) =>{

    try {

        const productId = req.query.productId

        const productData = await products.findById(productId)


        if(!productData){

            return res.status(404).json({ success: false, message: "Product not found" });
        }

        if(productData.productOffer.offerStatus){

            const updatedProductOfferStatus = await products.findByIdAndUpdate({_id:productId},{$set:{"productOffer.offerStatus":false}},{new:true})

            return res.status(200).json({
                success:true,
                message:"product offer status set to false",
                updatedProductOfferStatus:updatedProductOfferStatus
            })
        }else{

            const updatedProductOfferStatus = await products.findByIdAndUpdate({_id:productId},{$set:{"productOffer.offerStatus":true}},{new:true})

            return res.status(200).json({
                success:true,
                message:"product offer status set to true",
                updatedProductOfferStatus:updatedProductOfferStatus
            })
        }

    } catch (error) {
        
        console.log(`error while changing the status of the product offer`,error.message);
        return res.status(200).json({
            success:false,
            message:"error while changing the status of the product offer",
            
        })
    }
}
const loadEditProductOffer = async (req,res) =>{

    try {

        const {productId} = req.query

        const productData = await products.findOne({_id:productId})

        return res.status(200).render("admin/editProductOffer",{productData:productData})

    } catch (error) {
        
        console.log(`error while loading the product offer`,error.message);

        return res.status(500).render("admin/500")
        
    }
}
const editProductOffer = async (req,res) =>{

    try {

        const {productId,offerName,discountPercentage, expiryDate} = req.body

        
        if (!productId || !offerName || !discountPercentage || !expiryDate) {

            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const productGivenId = new ObjectId(productId)

        const productData = await products.findById(productGivenId)

        if(!productData){

            return res.status(404).json({success: false,message:"Product not found"});

        }

        const categoryData = await categories.findOne({_id:productData.category})

        if(!categoryData){

            return res.status(404).json({success: false,message:"No category found with the associated product for checking which offer is better"})

        }

        if(discountPercentage<=categoryData?.categoryOffer?.offerDiscountPercentage && new Date(categoryData?.categoryOffer?.offerExpiryDate) > new Date()){


            return res.status(200).json({ BetterOfferApplied:true, message: "product already has a better offer and is not expired"});
 
 
         }

         const discountAmount = (productData.salesPrice * discountPercentage) / 100;

         const updatedProduct = await products.findOneAndUpdate(
            { _id: productId },
            {
       
                $set: {
                    'productOffer.offerName': offerName,
                    'productOffer.offerDiscountPercentage': discountPercentage,
                    'productOffer.offerDiscountAmount': discountAmount,
                    'productOffer.offerExpiryDate': expiryDate,
                    productSalesPriceAfterOfferDiscount: productData.salesPrice - discountAmount
                }
            },

            { new: true }
        );
           
        return res.status(200).json({ success: true, message: "Product offer updated successfully", updatedProduct});

    } catch (error) {
        
        console.log(`error while editing the product offer`,error.message);
        
        return res.status(500).json({message:"Internal server error"})
        
    }
}

const deleteCategoryOffer = async (req,res) =>{

    try {
        
        const {id} = req.body

        const categoryId = new ObjectId(id)

        const categoryData = await categories.findById(categoryId)

        if(!categoryData){

            return res.status(404).render("user/404")

        }

        
    } catch (error) {
        
        console.log(`error while deleting the category offer`,error.message);

        return res.status(500).render("admin/500")
        
    }
}

module.exports = {

    // Admin Authentication

    loadLogin,
    registerAdmin,
    verifyAdmin,
    isSignout,

   // Page Loaders

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
    loadCategoryOffer,
    loadAddCategoryOffer,
    loadReturnedOrder,
    loadProductOffer,
    loadAddProductOffer,
    loadEditCategoryOffer,
    loadEditProductOffer,


     // User Management

    blockUnblock, 
   
     // Category and Brand Management

    addCategoryBrand,
    editCategory,
    editBrand,
    softDeleteCategory,
    softDeleteBrand,
    categoryExists,
    brandExists,

     // Product Management

    addProduct,
    editProduct,
    editImage,
    softDeleteProduct,
    ProductExists,
    
     // Order Management

    changeOrderStatus,
  
     // Coupon Management

    addCoupon,
    activateDeactivateCoupon,

   
     // Return Management

    approveReturn,
    rejectReturn,

     // Sales Reports

    getSalesData,
    getSalesDataJson,
    bestSellers,

   
    // Offer Management

    addCategoryOffer,
    activateDeactivateCategoryOffer,
    editCategoryOffer,
    deleteCategoryOffer,
    addProductOffer,
    activateDeactivateProductOffer,
    editProductOffer
    
  

}