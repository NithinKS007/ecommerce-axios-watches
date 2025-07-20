const products = require("../models/productModel");
const wishList = require("../models/wishList");
const statusCode = require("../utils/statusCodes");

const loadWishList = async (req, res) => {
  try {
    const currentUser = req?.currentUser;
    let pageNumber = parseInt(req.query.page) || 1;
    const perPageData = 8;
    const skip = (pageNumber - 1) * perPageData;

    let userWishList = await wishList.findOne({ userId: currentUser?._id });

    if (!userWishList) {
      const newWishList = new wishList({
        userId: currentUser?._id,
      });
      await newWishList.save();
      userWishList = newWishList;
    }

    const productIds = userWishList?.productIds || [];

    const [productData, totalProducts] = await Promise.all([
      products
        .find({ _id: { $in: productIds } })
        .populate("category")
        .skip(skip)
        .limit(perPageData)
        .exec(),

      products.countDocuments({ _id: { $in: productIds } }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalProducts / perPageData));
    pageNumber = Math.max(1, Math.min(pageNumber, totalPages));

    return res.status(statusCode.OK).render("user/wishList", {
      productData: productData,
      totalPages: totalPages,
      currentPage: pageNumber,
    });
  } catch (error) {
    console.log(`Error while loading the wishlist:`, error);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("user/500");
  }
};

const addToWishList = async (req, res) => {
  try {
    const currentUser = req?.currentUser;
    const { id: productId } = req.params;

    if (!productId) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ message: "Product id is required" });
    }

    const userWishList = await wishList
      .findOne({ userId: currentUser?._id })
      .exec();

    if (!userWishList) {
      const wishListProducts = new wishList({
        userId: currentUser?._id,
        productIds: [productId],
      });

      await wishListProducts.save();

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
    const { id: productId } = req.params;

    if (!productId) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ message: "Product id is required" });
    }

    const userWishList = await wishList
      .findOne({ userId: currentUser?._id })
      .exec();

    if (!userWishList) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ message: "User wishlist is not found" });
    }

    const product = await products.findById(productId).exec();

    if (!product) {
      return res
        .status(statusCode.NOT_FOUND)
        .json({ message: "Product not found" });
    }

    await wishList.updateOne(
      { userId: currentUser?._id },
      { $pull: { productIds: productId } }
    );

    return res.status(statusCode.OK).json({
      success: true,
      data: product.name,
      message: `${product.name} removed from your wishlist `,
    });
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
