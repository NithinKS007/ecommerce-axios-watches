require("dotenv").config();
const razorPayLib = require("razorpay");
const transaction = require("../models/onlineTransactionModel");
const { generateSignature } = require("./hashService");

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

    throw new Error(error);
  }
};

const verifyRazorPaySignature = async (orderId, paymentId, signature) => {
  const text = orderId + "|" + paymentId;

  const gs = await generateSignature(text, RAZORPAY_SECRECT_KEY);
  const transactionsData = await transaction.findOne({
    onlinePaymentOrderId: paymentId,
  });

  if (gs === signature) {
    transactionsData.paymentStatus = "paid";

    await transactionsData.save();
  }

  return gs === signature;
};

module.exports = { createRazorPayOrder, verifyRazorPaySignature };
