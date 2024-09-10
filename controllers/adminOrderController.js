const mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const products = require('../models/productModel')
const orders = require('../models/orderModel')
const transaction = require('../models/onlineTransactionModel')
const returnUserOrder = require('../models/returnOrderModel')
const wallet = require('../models/walletModel')

const getEnumValues = require('../utils/getEnumValues') 



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

        const totalOrdersPromise = orders.countDocuments(query);
     
        const skip = (pageNumber - 1) * perPageData;

        const orderDataPromise = orders.find(query)
        .populate("user")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPageData)
        .exec()

        const [totalOrders, orderData] = await Promise.all([totalOrdersPromise, orderDataPromise])

        const totalPages = Math.max(1, Math.ceil(totalOrders / perPageData));
        pageNumber = Math.max(1, Math.min(pageNumber, totalPages));

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

        const userOrderDataPromise = orders.findOne({ _id: orderId }).populate("user").exec();
        const transactionDetailsPromise = transaction.findOne({ orderId: orderId }).exec();

       const [userOrderDataDetails, transactionDetailsOftheOnlinePaymentOrder] = await Promise.all([
            userOrderDataPromise,
            transactionDetailsPromise
        ]);

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

        const order = await orders.findById(orderId)

        if(!order){

            return res.status(400).json({message:"Order not found"})
        }

            const allItemsCancelled = order.items.every(item => item.orderProductStatus === "cancelled");

            if (allItemsCancelled) {

                return res.status(200).json({ message: "User cancelled all products", adminCannotCancel: true })

            }

            order.items.forEach(item =>{

                if(item.orderProductStatus !=="cancelled"){
    
                    Object.assign(item,{orderProductStatus:selectedStatus})

                }
                
            })

            const [updatedStatusPerItem, updatedOrder] = await Promise.all([
                order.save(),
                orders.findOneAndUpdate(
                  { _id: order._id },
                  { $set: { orderStatus: selectedStatus } },
                  { new: true }
                )
              ])

              if (!updatedStatusPerItem || !updatedOrder) {

                return res.status(400).json({ message: "Failed to update order" })

              }

            if(order.paymentMethod==="razorPay"||order.paymentMethod==="wallet"){

                const walletData = await wallet.findOne({userId:order.user})

                if (!walletData) {

                    return res.status(400).json({ message: "This user doesn't have any wallet" })
                }

                const productsAmountThatHaventRefunded  = walletData.transactions
                      
                     .filter(walletRecord => walletRecord.type==="credit"&&walletRecord.orderId.equals(order._id))
                     .reduce((remainingRefundAmount,walletRecord) => remainingRefundAmount+walletRecord.amount,0)

                     const refundAmount = order.totalAmount - productsAmountThatHaventRefunded

                     const newWalletTransaction = {

                        orderId:order._id,
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

    
    
    } catch (error) {
        
        console.log(`error while updating the order status`,error.message);

        return res.status(500).json({
            message: "error while updating the order status",
            success: false
        });
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
                const searchObjectId = ObjectId.createFromHexString(searchQuery);
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

       
        const countReturnedOrdersPromise = returnUserOrder.countDocuments(query);
        const skip = (pageNumber - 1) * perPageData;
        const findReturnedOrdersPromise = returnUserOrder.find(query)
            .populate("userId")
            .skip(skip)
            .limit(perPageData)
            .sort({ createdAt: -1 })
            .exec();

            const [totalReturnedOrders, returnedOrderData] = await Promise.all([countReturnedOrdersPromise, findReturnedOrdersPromise]);

            const totalPages = Math.max(1, Math.ceil(totalReturnedOrders / perPageData));
            pageNumber = Math.max(1, Math.min(pageNumber, totalPages));

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
}


const approveReturn = async (req, res) => {
    try {
        const { returnOrderDocId, addToInventory } = req.body;


        const returnedOrderData = await returnUserOrder.findOne({ _id: returnOrderDocId });

        if (!returnedOrderData) {

            return res.status(404).json({ message: "Return order not found", success: false });
        }


       const { orderId, userId, productId, productRefundAmount: refundAmount } = returnedOrderData;


       const [orderData, walletData] = await Promise.all([orders.findById(orderId),wallet.findOne({ userId })])

        if (!orderData) {
            return res.status(404).json({ message: "Order not found", success: false });
        }
    
        if (!walletData) {

            return res.status(404).json({ message: "Wallet not found", success: false })

        }

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
        
        const { returnOrderDocId } = req.body;
      
        
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

    loadOrderList,
    loadOrderDetailsPage,
    changeOrderStatus,
    loadReturnedOrder,
    approveReturn,
    rejectReturn,


}