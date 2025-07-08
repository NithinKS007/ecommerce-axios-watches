const products = require("../models/productModel");
const wishList = require("../models/wishList");
const statusCode = require("../utils/statusCodes");

const loadWishList = async (req, res) => {
  try {
    const currentUser = req?.currentUser;

    let userWishList = await wishList.findOne({ userId: currentUser?._id });

    if (!userWishList) {
      const newWishList = new wishList({
        userId: currentUser?._id,
      });

      await newWishList.save();

      userWishList = newWishList;
    }

    const productIds = userWishList?.productIds || [];
    const productData = await products
      .find({ _id: { $in: productIds } })
      .populate("category");

    return res.status(statusCode.OK).render("user/wishList", { productData });
  } catch (error) {
    console.log(`Error while loading the wishlist:`, error);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("user/500");
  }
};

const addToWishList = async (req, res) => {
  try {
    const currentUser = req?.currentUser;
    const { id:productId } = req.params

    if (!productId) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ message: "Product id is required" });
    }

    const findExistingWishListForUser = await wishList
      .findOne({ userId: currentUser?._id })
      .exec();

    if (!findExistingWishListForUser) {
      const wishListProducts = new wishList({
        userId: currentUser?._id,
        productIds: [productId],
      });

      const wishListData = await wishListProducts.save();

      if (!wishListData) {
        return res.status(404).json({
          success: false,
          message: "Cannot add product to wishlist, something went wrong",
        });
      }

      return res.status(statusCode.OK).json({
        success: true,
        message: "Product added to the wishlist successfully",
      });
    } else {
      const productInWishList = await wishList
        .findOne({
          userId: currentUser?._id,
          productIds: { $in: [productId] },
        })
        .exec();

      if (productInWishList) {
        return res.status(statusCode.OK).json({
          success: true,
          message: "Product is already in the wishlist",
        });
      }

      await wishList.updateOne(
        { userId: currentUser?._id },
        { $push: { productIds: productId } }
      );

      return res.status(statusCode.OK).json({
        success: true,
        message: "Product added to the existing user's wishlist",
      });
    }
  } catch (error) {
    console.log(`Error while adding product to wishlist`, error.message);

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};

const removeFromWishList = async (req, res) => {
  try {
    const currentUser = req?.currentUser;
    const { id:productId } = req.params;

    if (!productId) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ message: "Product ID is required" });
    }

    const findExistingWishListForUser = await wishList
      .findOne({ userId: currentUser?._id })
      .exec();

    if (!findExistingWishListForUser) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ message: "User wishlist is not found" });
    } else {
      await wishList.updateOne(
        { userId: currentUser?._id },
        { $pull: { productIds: productId } }
      );

      return res.status(statusCode.OK).json({
        success: true,
        message: "Product removed from the existing user's wishlist ",
      });
    }
  } catch (error) {
    console.log(
      `error while removing the product from the wishlist`,
      error.message
    );

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};

module.exports = {
  loadWishList,
  addToWishList,
  removeFromWishList,
};
