const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

//cart items schema
const CartItemSchema = new mongoose.Schema(
  {
    product: {
      type: ObjectId,
      ref: "product",
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    productSalesPriceAfterOfferDiscount: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
    isSelected: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

//cart schema
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: ObjectId,
      ref: "user",
      required: true,
    },
    items: [CartItemSchema],

    couponCode: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const cart = mongoose.model("cart", cartSchema);

module.exports = cart;
