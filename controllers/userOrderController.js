const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
require("dotenv").config();

const products = require("../models/productModel");
const cart = require("../models/cartModel");
const userAddress = require("../models/addressModel");
const orders = require("../models/orderModel");
const coupons = require("../models/couponModel");
const transaction = require("../models/onlineTransactionModel");
const returnUserOrder = require("../models/returnOrderModel");
const wallet = require("../models/walletModel");

const { createRazorPayOrder } = require("../utils/razorpayService");
const priceSummary = require("../utils/priceSummary");
const getEnumValues = require("../utils/getEnumValues");
const statusCode = require("../utils/statusCodes");

const RAZORPAY_ID_KEY = process.env.RAZORPAY_ID_KEY;

const loadCheckout = async (req, res) => {
  try {
    const currentUser = req.currentUser;

    const [cartData, address] = await Promise.all([
      cart
        .findOne({ user: currentUser._id })
        .populate({ path: "items.product" }),
      userAddress.find({ userId: currentUser._id }),
    ]);

    const selectedItems = cartData.items.filter((item) => item.isSelected);

    const { couponCode } = cartData;

    const { finalPrice, subTotal, discount } = await priceSummary(
      cartData,
      couponCode
    );

    return res.status(statusCode.OK).render("user/checkout", {
      selectedItems,
      address,
      finalPrice,
      subTotal,
      discount,
      couponCode,
    });
  } catch (error) {
    console.log(`error while loading the checkout page`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("user/500");
  }
};

const loadPlaceOrder = async (req, res) => {
  try {
    const currentUser = req.currentUser;
    const lastOrderPlaced = await orders
      .findOne({ user: currentUser._id })
      .sort({ createdAt: -1 });
    return res
      .status(statusCode.OK)
      .render("user/placeOrder", { lastOrderPlacedId: lastOrderPlaced._id });
  } catch (error) {
    console.log(`Error while loading the place order page:`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("user/500");
  }
};

const loadOrders = async (req, res) => {
  let pageNumber = parseInt(req.query.page) || 1;
  const perPageData = 5;
  const skip = (pageNumber - 1) * perPageData;
  const currentUser = req?.currentUser;

  try {
    const [totalOrders, orderData] = await Promise.all([
      orders.countDocuments({ user: currentUser?._id }),
      orders
        .find({ user: currentUser?._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPageData)
        .exec(),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalOrders / perPageData));

    pageNumber = Math.max(1, Math.min(pageNumber, totalPages));

    const transactions = await transaction
      .find({
        orderId: { $in: orderData.map((order) => order._id) },
      })
      .exec();

    const orderDataWithTransactions = orderData.map((order) => {
      const transaction = transactions.find(
        (t) => t.orderId.toString() === order._id.toString()
      );
      return {
        ...order.toObject(),
        transaction: transaction || {},
      };
    });

    return res.status(statusCode.OK).render("user/orders", {
      orderData: orderDataWithTransactions,
      totalPages: totalPages,
      currentPage: pageNumber,
    });
  } catch (error) {
    console.log("Error while loading the orders page:", error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("user/500");
  }
};

const placeOrder = async (req, res) => {
  try {
    const currentUser = req.currentUser;

    if (!currentUser) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: "User not found",
      });
    }

    const { paymentMethod, addressId, couponCode } = req.body;

    if (!addressId) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: "Address id is required",
      });
    }

    const [cartData, addressData, walletData] = await Promise.all([
      cart
        .findOne({ user: currentUser._id })
        .populate({ path: "items.product", populate: ["brand", "category"] }),

      userAddress.findById(addressId),
      wallet.findOneAndUpdate(
        { userId: currentUser._id },
        { $setOnInsert: { userId: currentUser._id } },
        { upsert: true, new: true }
      ),
    ]);

    const { balance: walletBalance } = walletData;

    const { finalPrice, totalQuantity, subTotal, discount } =
      await priceSummary(cartData, couponCode);

    if (finalPrice > 1000 && paymentMethod === "cashOnDelivery") {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: "Cash on delivery only available for upto 1000Rs purchase.",
      });
    }

    if (paymentMethod === "wallet" && walletBalance < finalPrice) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    if (discount > 0 && couponCode) {
      await coupons.findOneAndUpdate(
        { couponCode },
        { $addToSet: { userBy: currentUser._id } },
        { new: true }
      );
    }
    const isSelectedItemsOnly = cartData.items.filter((item) => {
      return item.isSelected;
    });
    if (isSelectedItemsOnly.length === 0 || finalPrice === 0) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: "Something went wrong please try again",
      });
    }

    const orderItems = isSelectedItemsOnly.map((item) => ({
      product: item.product._id,
      productName: item.product.name,
      brand: item.product.brand._id,
      brandName: item.product.brand.name,
      category: item.product.category._id,
      categoryName: item.product.category.name,
      categoryDescription: item.product.category.description,
      quantity: item.quantity,
      price: item.price,
      productSalesPriceAfterOfferDiscount:
        item.productSalesPriceAfterOfferDiscount,
      description: item.product.description,
      targetGroup: item.product.targetGroup,
      displayType: item.product.displayType,
      strapColor: item.product.strapColor,
      strapMaterial: item.product.strapMaterial,
      dialShape: item.product.dialShape,
      images: item.product.images.map((image) => image.url || image.path),
    }));

    const order = new orders({
      onlinePaymentOrderId: null,
      items: orderItems,
      user: cartData.user,
      shippingAddress: {
        name: addressData.name,
        phone: addressData.phone,
        pincode: addressData.pincode,
        locality: addressData.locality,
        address: addressData.address,
        cityDistTown: addressData.cityDistTown,
        state: addressData.state,
        landMark: addressData.landMark,
        altPhone: addressData.altPhone,
        email: addressData.email,
        addressType: addressData.addressType,
      },

      totalItems: totalQuantity,
      subTotalAmount: subTotal,
      discountAmount: discount,
      totalAmount: finalPrice,
      paymentMethod: paymentMethod,
    });

    let razorPayOrder;

    if (paymentMethod === "razorPay") {
      try {
        razorPayOrder = await createRazorPayOrder(finalPrice);
        if (!razorPayOrder || !razorPayOrder?.id) {
          return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to create Razorpay order",
          });
        }
        order.onlinePaymentOrderId = razorPayOrder.id;
      } catch (error) {
        console.log(`Error creating Razorpay order: ${error.message}`);
        console.log(`Error creating Razorpay order: ${error}`);
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Failed to process payment through Razorpay",
        });
      }
    }

    const orderData = await order.save();

    if (paymentMethod === "razorPay") {
      const newTransaction = new transaction({
        userId: currentUser?._id,
        orderId: orderData?._id,
        paymentProvider: paymentMethod,
        onlinePaymentOrderId: razorPayOrder ? razorPayOrder?.id : null,
        amount: finalPrice,
      });

      await newTransaction.save();
    } else {
      if (paymentMethod === "wallet") {
        const newWalletTransaction = {
          orderId: orderData?._id,
          amount: finalPrice,
          type: "debit",
          walletTransactionStatus: "paid",
        };

        await wallet.findOneAndUpdate(
          { userId: currentUser._id },
          {
            $inc: { balance: -finalPrice },
            $push: { transactions: newWalletTransaction },
          },
          { new: true }
        );
      }
    }

    if (orderData) {
      const productIds = orderData.items.map((item) => item.product);

      const bulkOps = orderData.items.map((item) => ({
        updateOne: {
          filter: { _id: item?.product },
          update: { $inc: { stock: -item?.quantity } },
        },
      }));

      await Promise.all([
        products.bulkWrite(bulkOps),

        cart.findOneAndUpdate(
          { user: currentUser?._id },
          {
            $pull: { items: { product: { $in: productIds } } },
            $unset: { couponCode: "" },
          }
        ),
      ]);

      if (paymentMethod === "razorPay") {
        return res.status(statusCode.OK).json({
          success: true,
          message: "Razor pay order created",
          RAZORPAY_ID_KEY: RAZORPAY_ID_KEY,
          amount: finalPrice,
          razorPayOrderPaymentId: orderData?.onlinePaymentOrderId,
        });
      }

      return res.status(statusCode.OK).json({
        success: true,
        message: "Order placed successfully",
      });
    } else {
      return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to place order",
      });
    }
  } catch (error) {
    console.log(`error while placing the order`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong please try again",
    });
  }
};

const cancelOrder = async (req, res) => {
  const currentUser = req.currentUser;

  const walletData = await wallet.findOne({ userId: currentUser._id });

  if (!walletData) {
    const newWalletData = new wallet({
      userId: currentUser._id,
    });

    walletData = await newWalletData.save();
  }

  const { orderId, orderStatus } = req.body;

  try {
    const validStatuses = getEnumValues(orders.schema, "orderStatus");

    if (!validStatuses.includes(orderStatus)) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ message: "Invalid order status" });
    }

    const orderIdOfTheOrder = ObjectId.createFromHexString(orderId);

    const [order, walletData] = await Promise.all([
      orders.findOne({ _id: orderIdOfTheOrder }),
      wallet.findOne({ userId: currentUser._id }),
    ]);

    const { totalAmount } = order || {};

    const anyNotDelivered = order.items.some(
      (item) => item.orderProductStatus !== "delivered"
    );
    const allCancelled = order.items.every(
      (item) => item.orderProductStatus === "cancelled"
    );

    if (anyNotDelivered || !allCancelled) {
      await orders.updateOne(
        { _id: orderIdOfTheOrder },
        { $set: { orderStatus: "cancelled" } }
      );

      if (
        order.paymentMethod === "razorPay" ||
        order.paymentMethod === "wallet"
      ) {
        const productsAmountThatHaventRefunded = walletData.transactions
          .filter(
            (tx) => tx.type === "credit" && tx.orderId.equals(orderIdOfTheOrder)
          )
          .reduce((acc, tx) => acc + tx.amount, 0);

        const refundAmount = Math.max(
          totalAmount - productsAmountThatHaventRefunded,
          0
        );
        
        const newWalletTransaction = {
          orderId: orderIdOfTheOrder,
          amount: refundAmount,
          type: "credit",
          walletTransactionStatus: "refunded",
        };

        await wallet.findOneAndUpdate(
          { userId: currentUser._id },
          {
            $inc: { balance: refundAmount },
            $push: { transactions: newWalletTransaction },
          },
          { new: true }
        );
      }

      for (let item of order.items) {
        if (item.orderProductStatus !== "cancelled") {
          await orders.updateOne(
            { _id: orderIdOfTheOrder, "items._id": item._id },
            { $set: { "items.$.orderProductStatus": "cancelled" } }
          );

          await products.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } },
            { new: true }
          );
        }
      }

      return res.status(statusCode.OK).json({
        message: "order cancelled successfully",
      });
    }

    return res
      .status(statusCode.OK)
      .json({ message: "Order already delivered is delivered" });
  } catch (error) {
    console.log(`Error while canceling the order`, error.message);

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json({ message: "error while canceling the whole order" });
  }
};

const cancelOrderProduct = async (req, res) => {
  const currentUser = req.currentUser;

  if (!currentUser) {
    return res.status(statusCode.BAD_REQUEST).json({
      success: false,
      message: "User not found",
    });
  }

  const walletData = await wallet.findOne({ userId: currentUser._id });

  if (!walletData) {
    const newWalletData = new wallet({
      userId: currentUser._id,
    });

    walletData = await newWalletData.save();
  }

  const { itemId, orderId, orderProductStatus } = req.body;

  try {
    const validStatuses = getEnumValues(
      orders.schema,
      "items.orderProductStatus"
    );

    if (!validStatuses.includes(orderProductStatus)) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ message: "Invalid order product status" });
    }

    const orderIdOfTheItem = ObjectId.createFromHexString(itemId);
    const orderIdOfTheCart = ObjectId.createFromHexString(orderId);

    let updatedProductStatus;

    if (orderProductStatus === "pending" || orderProductStatus === "shipped") {
      updatedProductStatus = await orders.updateOne(
        { _id: orderIdOfTheCart, "items._id": orderIdOfTheItem },
        { $set: { "items.$.orderProductStatus": "cancelled" } }
      );

      if (updatedProductStatus.modifiedCount > 0) {
        const orderData = await orders.findById(orderIdOfTheCart);
        const { subTotalAmount, discountAmount, items } = orderData;
        const canceledItem = items.find((item) =>
          item._id.equals(orderIdOfTheItem)
        );

        if (!canceledItem) {
          return res
            .status(404)
            .json({ message: "Item not found in the order" });
        }
        

        let itemTotalAmount, itemDiscount;
        if (canceledItem.productSalesPriceAfterOfferDiscount !== 0) {
          itemTotalAmount =
            canceledItem.productSalesPriceAfterOfferDiscount *
            canceledItem.quantity;
        } else {
          itemTotalAmount = canceledItem.price * canceledItem.quantity;
        }
        const itemProportion = itemTotalAmount / subTotalAmount;
        itemDiscount = itemProportion * discountAmount;
        const priceAfterEverything =
          itemTotalAmount - parseFloat(itemDiscount);

        const walletData = await wallet.findOne({ userId: currentUser._id });

        if (!walletData) {
          return res.status(404).json({ message: "Wallet not found" });
        }

        if (
          orderData.paymentMethod === "razorPay" ||
          orderData.paymentMethod === "wallet"
        ) {
          const newWalletTransaction = {
            orderId: orderIdOfTheCart,
            amount: priceAfterEverything,
            type: "credit",
            walletTransactionStatus: "refunded",
          };

          await wallet.findOneAndUpdate(
            { userId: currentUser._id },
            {
              $inc: { balance: priceAfterEverything },
              $push: { transactions: newWalletTransaction },
            },
            { new: true }
          );
        }

        const orderDataOfTheProduct = await orders.aggregate([
          { $match: { _id: orderIdOfTheCart } },
          { $unwind: "$items" },
          { $match: { "items._id": orderIdOfTheItem } },
          {
            $project: {
              _id: 0,
              quantity: "$items.quantity",
              productId: "$items.product",
            },
          },
        ]);

        const anyNotDelivered = orderData.items.some(
          (item) => item.orderProductStatus !== "delivered"
        );
        const allCancelled = orderData.items.every(
          (item) => item.orderProductStatus === "cancelled"
        );

        let allOrderCancelled;

        if (anyNotDelivered && allCancelled) {
          allOrderCancelled = await orders.updateOne(
            { _id: orderIdOfTheCart },
            { $set: { orderStatus: "cancelled" } }
          );
        }

        const { quantity, productId } = orderDataOfTheProduct[0] || {};

        const updateStockQuantityAfterCancel = await products.findByIdAndUpdate(
          productId,
          { $inc: { stock: quantity } },
          { new: true }
        );

        if (updateStockQuantityAfterCancel) {
          return res.status(statusCode.OK).json({
            message: "product status updated successfully",
            success: true,
            updatedProductStatus: updatedProductStatus,
            returnStatus: false,
            allOrderCancelled: allOrderCancelled,
          });
        }
      }
    } else if (orderProductStatus === "delivered") {
      return res.status(statusCode.OK).json({
        message: "Product already delivered , return only",
        returnStatus: true,
      });
    }

    return res
      .status(statusCode.BAD_REQUEST)
      .json({ message: "cannot change status", success: false });
  } catch (error) {
    console.log(`Error while canceling the product`, error.message);

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json({ message: `Error while canceling the product` });
  }
};

const returnProductOrder = async (req, res) => {
  const currentUser = req.currentUser;

  if (!currentUser) {
    return res.status(statusCode.BAD_REQUEST).json({
      success: false,
      message: "User not found",
    });
  }

  try {
    let walletData = await wallet.findOne({ userId: currentUser._id });

    if (!walletData) {
      const newWalletData = new wallet({
        userId: currentUser._id,
      });

      walletData = await newWalletData.save();
    }

    const { itemId, productId, orderId, orderProductStatus, reason } = req.body;

    const validStatuses = getEnumValues(
      orders.schema,
      "items.orderProductStatus"
    );

    if (!validStatuses.includes(orderProductStatus)) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ error: "Invalid order product status" });
    }

    let updatedProductStatus;
    let allDeliveredItemsReturned;

    if (
      orderProductStatus === "delivered" ||
      !orderProductStatus === "cancelled" ||
      !orderProductStatus === "pending" ||
      !orderProductStatus === "shipped" ||
      !orderProductStatus === "returnInitiated" ||
      !orderProductStatus === "returnApproved" ||
      !orderProductStatus === "returnRejected"
    ) {
      updatedProductStatus = await orders.updateOne(
        { _id: orderId, "items._id": itemId },
        { $set: { "items.$.orderProductStatus": "returnInitiated" } }
      );
    }

    if (updatedProductStatus && updatedProductStatus.modifiedCount > 0) {
      const orderData = await orders.findOne({ _id: orderId });

      const { subTotalAmount, discountAmount, items } = orderData;

      const returnedItem = items.find((item) => item.product.equals(productId));

      let itemTotalAmount, itemDiscount;

      if (returnedItem.productSalesPriceAfterOfferDiscount !== 0) {
        itemTotalAmount =
          returnedItem.productSalesPriceAfterOfferDiscount *
          returnedItem.quantity;
      } else {
        itemTotalAmount = returnedItem.price * returnedItem.quantity;
      }

      const itemProportion = itemTotalAmount / subTotalAmount;
      itemDiscount = itemProportion * discountAmount;
      const priceAfterEverything =
        itemTotalAmount - parseFloat(itemDiscount.toFixed(2));

      allDeliveredItemsReturned = !orderData.items.some(
        (item) => item.orderProductStatus === "delivered"
      );

      if (allDeliveredItemsReturned) {
        await orders.updateOne(
          { _id: orderId },
          { $set: { orderStatus: "returnInitiated" } }
        );
      }

      const returnProductOrderData = new returnUserOrder({
        orderId: orderId,
        userId: currentUser._id,
        productId: productId,
        productRefundAmount: priceAfterEverything,
        productReturnReason: reason,
      });

      await returnProductOrderData.save();
    }

    return res.status(statusCode.OK).json({
      message: "individual order status updated successfully",
      success: true,
      allDeliveredItemsReturned: allDeliveredItemsReturned,
    });
  } catch (error) {
    console.log(`error while returning the whole order`, error.message);

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal Server Error" });
  }
};

const loadOrderDetails = async (req, res) => {
  try {
    const { id:orderId } = req.params;
    console.log(orderId)
    const [orderData, transactions] = await Promise.all([
      orders.findById(orderId).exec(),
      transaction.findOne({ orderId }).exec(),
    ]);

    return res
      .status(statusCode.OK)
      .render("user/orderDetails", { orderData, transactions });
  } catch (error) {
    console.log(`error while loading the order details page`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "error while loading the order details page",
    });
  }
};
module.exports = {
  loadCheckout,
  loadPlaceOrder,
  loadOrders,
  placeOrder,
  cancelOrder,
  cancelOrderProduct,
  returnProductOrder,
  loadOrderDetails,
};
