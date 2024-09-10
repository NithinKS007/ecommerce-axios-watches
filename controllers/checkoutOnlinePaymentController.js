require('dotenv').config();

const orders = require('../models/orderModel')
const transaction = require('../models/onlineTransactionModel')
const {createRazorPayOrder, verifyRazorPaySignature} = require('../utils/razorpayService')
const RAZORPAY_ID_KEY  = process.env.RAZORPAY_ID_KEY 

const loadPaymentFailure = async (req,res) =>{

    try {

        return res.status(200).render("user/paymentFailure")
        
    } catch (error) {
        
        console.log(`error while loading the payment failure page`,error.message);

        return res.status(500).render("user/500")
        
    }
}

const verifyOnlinePayment = async (req,res) =>{

    try {
        
        const {paymentId, orderId, signature} = req.body

    

        const isValidPayment = verifyRazorPaySignature(paymentId,orderId,signature)

        if (isValidPayment) {

            await transaction.findOneAndUpdate({onlinePaymentOrderId:orderId},
            {$set:{paymentStatus:"paid"}}
            )
          return  res.json({ success: true ,message:"Online payment verifyed for razorpay" });

        } else {

          return  res.status(400).json({ success: false,message:"Cannot verify online payment for razorpay" });

        }
        
    } catch (error) {
        
        console.log(`error while verifiying the online payment for razorpay`,error.message);

        return  res.status(500).json({ success: false,message:"Cannot verify online payment for razorpay" });
    }
}

const handleOnlinePaymentFailure = async (req,res) =>{

    try {

        const { orderId } = req.body

     

        const transactionsData = await transaction.findOneAndUpdate(
            { onlinePaymentOrderId: orderId },  
            { $set: { paymentStatus: "failed" } },  
            { new: true }  
        );

       
       

        if (!transactionsData) {
         
            return res.status(404).json({ message: "Cannot find transaction data for cancellation", success: false });
        }

       return res.status(200).json({ message: "Payment status updated to failed", success: true });
        
        
    } catch (error) {
        

        console.log(`error while checking the onlinepayment failure`,error.message);

        return res.status(500).json({message:"Error while updating the onlinepayment status to failure`",success:false})
        
    }
}
const loadRetryOrderCheckout = async (req,res) =>{

    try {

    const orderId = req.query.orderId;

    const orderData = await orders.findOne({_id:orderId})

    return res.status(200).render("user/retryCheckout",{orderData:orderData})


    } catch (error) {

        console.log(`error while loading the checkout page for retrying order`,error.message);
        
        return res.status(500).render("user/500")
    }
}
const retryOrderPayment = async (req,res) =>{

    try {

        const {orderId} = req.body

        const [orderData, transactionsDataOfTheOrder] = await Promise.all([
            orders.findById(orderId),
            transaction.findOne({ orderId: orderId })
        ]);

        if (!orderData || !transactionsDataOfTheOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order or transaction not found',
            });
        }

        let razorPayOrder
        const totalAmount = orderData.totalAmount
        
        if(orderData.paymentMethod==="razorPay"){

            razorPayOrder = await createRazorPayOrder(totalAmount)

            if (!razorPayOrder||!razorPayOrder.id) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create Razorpay order',
                });
            }

            orderData.onlinePaymentOrderId = razorPayOrder.id
            transactionsDataOfTheOrder.onlinePaymentOrderId = razorPayOrder.id
            transactionsDataOfTheOrder.paymentStatus = "paid"
    
            

        }

        const [changedOrderData, updatedTransactionData] = await Promise.all([
            orderData.save(),
            transactionsDataOfTheOrder.save()
        ]);

        return res.status(200).json({

            success:true,
            message:"Razor pay order created",
            RAZORPAY_ID_KEY:RAZORPAY_ID_KEY,
            amount:changedOrderData.totalAmount,
            razorPayOrderPaymentId:changedOrderData.onlinePaymentOrderId

        })
        
    } catch (error) {

        console.log(`error while changing the status of the payment on retry order`,error.message)
        return res.status(500).json({success: false,message: 'Failed to retry the payment through Razorpay'});
        
    }
}


module.exports = {

    loadPaymentFailure,
    loadRetryOrderCheckout,
    verifyOnlinePayment,
    handleOnlinePaymentFailure,
    retryOrderPayment,
}