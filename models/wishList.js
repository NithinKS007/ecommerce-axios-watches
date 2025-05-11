const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const wishListSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      ref: "user",
      required: true,
    },
    productIds: [
      {
        type: ObjectId,
        ref: "product",
      },
    ],
  },
  { timestamps: true }
);

const wishList = mongoose.model("wishList", wishListSchema);

module.exports = wishList;
