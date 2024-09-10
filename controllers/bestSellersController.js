const orders = require('../models/orderModel')

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
                    productSalesPriceAfterOfferDiscount:"$productDetails.productSalesPriceAfterOfferDiscount",
                    productOffer: "$productDetails.productOffer",
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



module.exports = {

    bestSellers,
}