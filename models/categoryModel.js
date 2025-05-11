const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const offerSchema = new Schema(
  {
    offerName: {
      type: String,
      required: true,
    },
    offerDiscountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
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

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    categoryOffer: offerSchema,
  },
  { timestamps: true }
);

const categories = mongoose.model("category", categorySchema);

module.exports = categories;
