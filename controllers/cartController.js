const products = require("../models/productModel");
const cart = require("../models/cartModel");
const coupons = require("../models/couponModel");

const priceSummary = require("../utils/priceSummary");

const loadCart = async (req, res) => {
  try {
    const currentUser = req?.currentUser;

    const [cartDetails, couponDetails, isAlreadyUsedCoupons] =
      await Promise.all([
        cart.find({ user: currentUser }).populate("items.product").exec(),
        coupons.find({ couponStatus: true }).exec(),
        coupons.find({ userBy: currentUser }).exec(),
      ]);

    if (!cartDetails) {
      return res.status(404).render("user/404");
    }
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

    return res
      .status(200)
      .render("user/cart", {
        cartDetails,
        finalPrice,
        subTotal,
        selectedItemsCount,
        availableCoupons,
      });
  } catch (error) {
    console.log(`error while loading the cart page`, error.message);

    return res.status(500).render("user/500");
  }
};

const addToCart = async (req, res) => {
  const { productId } = req.body;

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
      return res.status(404).json({
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
        return res.status(404).json({
          success: false,

          message: "Cannot save the cart data",
        });
      }

      return res.status(200).json({
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

      return res.status(200).json({
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

    return res.status(500).json({
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
      return res.status(200).json({
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
      return res.status(500).json({
        success: false,
        message: "Something went wrong while deleting item from the cart",
      });
    }
  } catch (error) {
    console.log("Error while removing an item from the cart", error.message);

    return res.status(500).json({
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
      return res.status(404).json({ message: "Product not found" });
    }

    const productStock = productItem.stock;

    if (Number(quantity) > productStock) {
      return res
        .status(200)
        .json({
          message: `Only ${productStock} is available`,
          quantity: false,
        });
    }

    if (quantity < 1 || quantity > 5) {
      return res
        .status(400)
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

    return res
      .status(200)
      .json({
        success: true,
        updatedItem,
        finalPrice: finalPrice,
        subTotal: subTotal,
        discount: discount,
      });
  } catch (error) {
    return res.status(500).json({ message: "Error updating quantity" });
  }
};

const updatedSelectedItems = async (req, res) => {
  try {
    const { selectedProductIds, couponCode } = req.body;

    const currentUser = req.currentUser;

    const cartDetails = await cart.findOne({ user: currentUser._id });

    if (!cartDetails) {
      return res
        .status(400)
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

    return res
      .status(200)
      .json({
        message: "Cart updated successfully",
        finalPrice: finalPrice,
        cartDetails: cartDetails,
        subTotal: subTotal,
        discount: discount,
      });
  } catch (error) {
    console.log(`error while updating the selection `, error.message);

    return res
      .status(500)
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
