const coupons = require("../models/couponModel");

const formatCurrency = (amount) => {
  return parseFloat(amount.toFixed(2));
};

const generateResponse = (
  message = "",
  subTotal,
  finalPrice,
  totalQuantity,
  discount
) => {
  return {
    message: message,
    subTotal: formatCurrency(subTotal),
    finalPrice: formatCurrency(finalPrice),
    totalQuantity,
    discount: formatCurrency(discount),
  };
};

const filterSelectedItems = (cartData) => {
  return cartData.items.filter((item) => item?.isSelected);
};

const calculateTotalQuantity = (selectedItems) => {
  return selectedItems.reduce((total, item) => total + item.quantity, 0);
};
const calculateSubTotal = (selectedItems) => {
  return selectedItems.reduce((subTotal, item) => {
    let itemPrice = item.price;
    if (
      item?.product?.productOffer &&
      new Date(item?.product?.productOffer?.offerExpiryDate) > new Date() &&
      item?.product?.productOffer.offerStatus
    ) {
      itemPrice = item.product.productSalesPriceAfterOfferDiscount;
    }

    return subTotal + itemPrice * item.quantity;
  }, 0);
};


const priceSummary = async (cartData, couponCode) => {
  try {
    if (!cartData?.items?.length) {
      return generateResponse("", 0, 0, 0, 0);
    }
    const selectedItems = filterSelectedItems(cartData);
    const subTotal = calculateSubTotal(selectedItems);

    let finalPrice = subTotal;

    const totalQuantity = calculateTotalQuantity(selectedItems);

    let discount = 0;

    if (couponCode) {
      const coupon = await coupons.findOne({ couponCode: couponCode });

      if (coupon && coupon.couponStatus) {
        if (finalPrice >= coupon.minAmount) {
          discount = (finalPrice * coupon.couponDiscount) / 100;
          if (discount > coupon.maxAmount) {
            discount = coupon.maxAmount;
          }
          finalPrice -= discount;
        } else {
          return generateResponse(
            "Minimum amount for coupon is not met",
            subTotal,
            finalPrice,
            totalQuantity,
            0
          );
        }
      } else {
        return generateResponse(
          "Invalid or inactive coupon code",
          subTotal,
          finalPrice,
          totalQuantity,
          0
        );
      }
    }
    return generateResponse("", subTotal, finalPrice, totalQuantity, discount);
  } catch (error) {
    console.log(`Error while calculating the price details: ${error.message}`);

    return res
      .status(500)
      .json({ message: "Error while calculating the price" });
  }
};

module.exports = priceSummary;
