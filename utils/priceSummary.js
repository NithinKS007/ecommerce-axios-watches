const products = require('../models/productModel')
const coupons = require('../models/couponModel')

const priceSummary = async (cartData, couponCode) => {
    try {
      if (cartData?.items?.length > 0) {
        const selectedItems = cartData.items.filter((item) => item?.isSelected);
        
        let subTotal = 0;
        for (const item of selectedItems) {
          let itemPrice = item.price;
          const product = await products.findOne({ _id: item.product?._id });
          if (item?.product?.productOffer && new Date(item?.product?.productOffer?.offerExpiryDate) > new Date() && item?.product?.productOffer.offerStatus ) {

            itemPrice = item.product.productSalesPriceAfterOfferDiscount;

          }

          subTotal += itemPrice * item.quantity;

        }
  
        let finalPrice = subTotal;
        const totalQuantity = selectedItems.reduce((total, item) => total + item.quantity, 0);
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
              return {
                message: "Minimum amount for coupon is not met",
                subTotal: parseFloat(subTotal.toFixed(2)),
                finalPrice: parseFloat(finalPrice.toFixed(2)),
                totalQuantity,
                discount: 0
              };
            }
          } else {
            return {
              message: "Invalid or inactive coupon code",
              subTotal: parseFloat(subTotal.toFixed(2)),
              finalPrice: parseFloat(finalPrice.toFixed(2)),
              totalQuantity,
              discount: 0
            };
          }
        }
  
        return {
          subTotal: parseFloat(subTotal.toFixed(2)),
          finalPrice: parseFloat(finalPrice.toFixed(2)),
          totalQuantity,
          discount: parseFloat(discount.toFixed(2))
        };
      }
  
      return { subTotal: 0, finalPrice: 0, totalQuantity: 0, discount: 0 };
    } catch (error) {
      console.log(`Error while calculating the price details: ${error.message}`)

      return res.status(500).json({message:"Error while calculating the price"})
    }
  };

  module.exports = priceSummary