const products = require("../models/productModel");
const cart = require("../models/cartModel");
const coupons = require("../models/couponModel");

const priceSummary = require("../utils/priceSummary");
const statusCode = require("../utils/statusCodes");
const statusCodes = require("../utils/statusCodes");

const loadCart = async (req, res) => {
  try {
    const currentUser = req?.currentUser;
    let pageNumber = parseInt(req.query.page) || 1;
    const perPageData = 3;

    let [cartDetails, couponDetails, isAlreadyUsedCoupons] = await Promise.all([
      cart.find({ user: currentUser }).populate("items.product").exec(),
      coupons.find({ couponStatus: true }).exec(),
      coupons.find({ userBy: currentUser }).exec(),
    ]);

    if (!cartDetails) {
      return res.status(statusCode.NOT_FOUND).render("user/404");
    }

    const totalItems = cartDetails[0].items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / perPageData));

    pageNumber = Math.max(1, Math.min(pageNumber, totalPages));

    const skip = (pageNumber - 1) * perPageData;

    const itemsData = cartDetails[0].items
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + perPageData);

    const usedCoupons = isAlreadyUsedCoupons.map((coupon) => coupon.couponCode);

    const availableCoupons = couponDetails.filter(
      (coupon) => !usedCoupons.includes(coupon.couponCode)
    );

    const cartDetailsForPriceCalculation = await cart
      .findOne({ user: currentUser })
      .populate("items.product")
      .exec();

    const { finalPrice, subTotal } = await priceSummary(
      cartDetailsForPriceCalculation
    );

    const selectedItemsCount = cartDetailsForPriceCalculation?.items.filter(
      (item) => item?.isSelected
    ).length;

    cartDetails[0].items = itemsData;
    return res.status(statusCode.OK).render("user/cart", {
      cartDetails,
      finalPrice,
      subTotal,
      selectedItemsCount,
      availableCoupons,
      totalPages,
      currentPage: pageNumber,
    });
  } catch (error) {
    console.log(`error while loading the cart page`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("user/500");
  }
};

const addToCart = async (req, res) => {
  const productId = req.params.id;
  const currentUser = req?.currentUser;

  try {
    const [findExistingCart, productDetails] = await Promise.all([
      cart.findOne({ user: currentUser._id }).exec(),
      products
        .findOne(
          { _id: productId },
          { salesPrice: 1, productSalesPriceAfterOfferDiscount: 1, _id: 0 }
        )
        .exec(),
    ]);

    if (!productDetails) {
      return res.status(statusCode.NOT_FOUND).json({
        success: false,
        message: "Product not found",
      });
    }
    const { salesPrice, productSalesPriceAfterOfferDiscount } = productDetails;

    if (!findExistingCart) {
      const cartItem = new cart({
        user: currentUser._id,
        items: [
          {
            product: productId,
            price: salesPrice,
            productSalesPriceAfterOfferDiscount:
              productSalesPriceAfterOfferDiscount,
          },
        ],
      });

      const savedCartData = await cartItem.save();

      if (!savedCartData) {
        return res.status(statusCode.NOT_FOUND).json({
          success: false,

          message: "Cannot save the cart data",
        });
      }

      return res.status(statusCode.OK).json({
        success: true,
        message:
          "New cart created for the user and added the product to items array successfully",
      });
    } else {
      await cart.updateOne(
        { user: currentUser?._id },
        {
          $push: {
            items: {
              product: productId,
              price: salesPrice,
              productSalesPriceAfterOfferDiscount:
                productSalesPriceAfterOfferDiscount,
            },
          },
        }
      );

      return res.status(statusCode.OK).json({
        success: true,
        message:
          "product added to items array for the existing cart successfully",
      });
    }
  } catch (error) {
    console.log(
      `error while adding product to cart from product details page backend`,
      error.message
    );

    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error while adding product to cart",
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId, couponCode } = req.body;

    const currentUser = req?.currentUser;

    const [deletedProductFromCart, productName] = await Promise.all([
      cart.updateOne(
        { user: currentUser._id },
        { $pull: { items: { product: productId } } }
      ),
      products.findById(productId),
    ]);

    const cartDetails = await cart
      .findOne({ user: currentUser._id })
      .populate({ path: "items.product" });

    const { finalPrice, subTotal, discount } = await priceSummary(
      cartDetails,
      couponCode
    );

    const isCartEmpty = await cart.findOne({ user: currentUser._id });

    const isEmpty = isCartEmpty.items.length === 0;

    if (deletedProductFromCart) {
      return res.status(statusCode.OK).json({
        success: true,
        message: "Item deleted from the cart successfully",
        isEmpty: isEmpty,
        productName: productName,
        subTotal: subTotal,
        finalPrice: finalPrice,
        discount: discount,
        cartDetails,
        couponCode,
      });
    } else {
      return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Something went wrong while deleting item from the cart",
      });
    }
  } catch (error) {
    console.log("Error while removing an item from the cart", error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong while deleting item from the cart",
    });
  }
};

const updateQuantityFromCart = async (req, res) => {
  try {
    const { productId, quantity, couponCode } = req.body;

    const currentUser = req.currentUser;

    const productItem = await products.findOne(
      { _id: productId },
      { stock: 1, _id: 0 }
    );

    if (!productItem) {
      return res
        .status(statusCode.NOT_FOUND)
        .json({ message: "Product not found" });
    }

    const productStock = productItem.stock;

    if (Number(quantity) > productStock) {
      return res.status(statusCode.OK).json({
        message: `Only ${productStock} is available`,
        quantity: false,
      });
    }

    if (quantity < 1 || quantity > 5) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({ message: `Quantity must be between 1 and ${quantity}` });
    }

    const updatedItem = await cart
      .findOneAndUpdate(
        { user: currentUser._id, "items.product": productId },
        { $set: { "items.$.quantity": quantity } },
        { new: true }
      )
      .populate({ path: "items.product" });

    const { finalPrice, subTotal, discount } = await priceSummary(
      updatedItem,
      couponCode
    );

    return res.status(statusCode.OK).json({
      success: true,
      updatedItem,
      finalPrice: finalPrice,
      subTotal: subTotal,
      discount: discount,
    });
  } catch (error) {
    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json({ message: "Error updating quantity" });
  }
};

const updatedSelectedItems = async (req, res) => {
  try {
    const { selectedProductIds, couponCode } = req.body;

    const currentUser = req.currentUser;

    const cartDetails = await cart.findOne({ user: currentUser._id });

    if (!cartDetails) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ message: "No selected items in the cart", success: false });
    }

    cartDetails.items = cartDetails.items.map((item) => {
      if (selectedProductIds.includes(item.product.toString())) {
        item.isSelected = true;
      } else {
        item.isSelected = false;
      }

      return item;
    });

    const savedCartData = await cartDetails.save();

    const finalSavedCartData = await savedCartData.populate({
      path: "items.product",
    });

    const { finalPrice, subTotal, discount } = await priceSummary(
      finalSavedCartData,
      couponCode
    );

    return res.status(statusCode.OK).json({
      message: "Cart updated successfully",
      finalPrice: finalPrice,
      cartDetails: cartDetails,
      subTotal: subTotal,
      discount: discount,
    });
  } catch (error) {
    console.log(`error while updating the selection `, error.message);

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json({ message: `Error while selecting items in the cart` });
  }
};

module.exports = {
  loadCart,
  addToCart,
  removeFromCart,
  updateQuantityFromCart,
  updatedSelectedItems,
};
