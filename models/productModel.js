const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const offerSchema = new Schema(
  {
    offerName: {
      type: String,
      required: true,
      trim: true,
    },
    offerDiscountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    offerDiscountAmount: {
      type: Number,
      required: true,
    },
    offerStartDate: {
      type: Date,
      required: true,
    },
    offerExpiryDate: {
      type: Date,
      required: true,
    },
    offerStatus: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    category: {
      type: ObjectId,
      ref: "category",
      required: true,
    },
    brand: {
      type: ObjectId,
      ref: "brand",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dialShape: {
      type: String,
      required: true,
      trim: true,
    },
    displayType: {
      type: String,
      required: true,
      trim: true,
    },
    salesPrice: {
      type: Number,
      required: true,
    },
    images: {
      type: Array,
      required: true,
    },
    strapMaterial: {
      type: String,
      required: true,
      trim: true,
    },
    strapColor: {
      type: String,
      required: true,
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    targetGroup: {
      type: String,
      required: true,
      trim: true,
    },

    productSalesPriceAfterOfferDiscount: {
      type: Number,
      default: 0,
    },
    productOffer: offerSchema,
  },
  { timestamps: true }
);

const products = mongoose.model("product", productSchema);

module.exports = products;
