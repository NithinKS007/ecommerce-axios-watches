require("dotenv").config();
const razorPayLib = require("razorpay");
const crypto = require("crypto");
const transaction = require("../models/onlineTransactionModel");

const RAZORPAY_SECRECT_KEY = process.env.RAZORPAY_SECRECT_KEY;
const RAZORPAY_ID_KEY = process.env.RAZORPAY_ID_KEY;

const razorpay = new razorPayLib({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRECT_KEY,
});
const createRazorPayOrder = async (amount) => {
  try {
    const data = {
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt" + Date.now(),
      payment_capture: 1,
    };

    const razorPayOrder = await razorpay.orders.create(data);

    return razorPayOrder;
  } catch (error) {
    console.error(
      "Razorpay Error:",
      error.response ? error.response.data : error.message
    );

    throw error;
  }
};

const verifyRazorPaySignature = async (orderId, paymentId, signature) => {
  const text = orderId + "|" + paymentId;

  const generateSignature = crypto
    .createHmac("sha256", RAZORPAY_SECRECT_KEY)
    .update(text)
    .digest("hex");

  const transactionsData = await transaction.findOne({
    onlinePaymentOrderId: paymentId,
  });

  if (generateSignature === signature) {
    transactionsData.paymentStatus = "paid";

    await transactionsData.save();
  }

  return generateSignature === signature;
};

module.exports = { createRazorPayOrder, verifyRazorPaySignature };
