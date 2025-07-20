const cart = require("../models/cartModel");
const priceSummary = require("../utils/priceSummary");
const coupons = require("../models/couponModel");
const statusCode = require("../utils/statusCodes");
const statusCodes = require("../utils/statusCodes");

const applyCoupon = async (req, res) => {
  try {
    const currentUser = req?.currentUser;

    const { couponCode } = req.body;

    if (couponCode) {
      const cartDetailsForPriceCalculation = await cart
        .findOne({ user: currentUser?._id })
        .populate({ path: "items.product" });

      const { finalPrice, discount, message, subTotal } = await priceSummary(
        cartDetailsForPriceCalculation,
        couponCode
      );

      if (message) {
        return res
          .status(statusCode.BAD_REQUEST)
          .json({ message, success: false, finalPrice, discount, subTotal });
      }

      await cart.updateOne(
        { user: currentUser?._id },
        { $set: { couponCode } }
      );

      return res.status(statusCode.OK).json({
        message: "coupon successfully added",
        success: true,
        finalPrice,
        discount,
        subTotal,
      });
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ message: "Invalid coupon code", success: false });
    }
  } catch (error) {
    console.log(`error while adding the coupon`, error.message);

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal Server error", success: false });
  }
};

const removeCoupon = async (req, res) => {
  try {
    const currentUser = req?.currentUser;

    const cartDetails = await cart
      .findOne({ user: currentUser?._id })
      .populate({ path: "items.product" });

    if (cartDetails) {
      const { finalPrice, discount, subTotal } = await priceSummary(
        cartDetails
      );

      await cart.updateOne(
        { user: currentUser?._id },
        { $unset: { couponCode: "" } }
      );

      return res.status(statusCode.OK).json({
        message: "coupon successfully removed",
        success: true,
        finalPrice,
        discount,
        subTotal,
      });
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ message: "No cart found", success: false });
    }
  } catch (error) {
    console.log(`error while removing the coupon`, error.message);

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal Server error", success: false });
  }
};

const loadCoupon = async (req, res) => {
  let pageNumber = parseInt(req.query.page) || 1;
  const perPageData = 5;

  const searchQuery = req.query.search || "";
  const statusFilter = req.query.status || "";

  try {
    const query = {};

    if (searchQuery) {
      query.$or = [
        { couponName: { $regex: searchQuery, $options: "i" } },
        { couponCode: { $regex: searchQuery, $options: "i" } },
      ];
    }

    if (statusFilter) {
      if (statusFilter === "Active") {
        query.couponStatus = true;
      } else if (statusFilter === "Inactive") {
        query.couponStatus = false;
      }
    }

    const skip = (pageNumber - 1) * perPageData;
    const [totalCoupons, couponsData] = await Promise.all([
      coupons.countDocuments(query),
      coupons
        .find(query)
        .skip(skip)
        .limit(perPageData)
        .sort({ createdAt: -1 })
        .exec(),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCoupons / perPageData));
    pageNumber = Math.max(1, Math.min(pageNumber, totalPages));

    return res.status(statusCode.OK).render("admin/couponList", {
      couponsData: couponsData,
      totalPages: totalPages,
      currentPage: pageNumber,
      search: searchQuery,
      statusFilter: statusFilter,
    });
  } catch (error) {
    console.log("Error while loading the coupons:", error.message);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("admin/500");
  }
};

const loadAddCoupon = async (req, res) => {
  try {
    return res.status(statusCode.OK).render("admin/addCoupon", { message: "" });
  } catch (error) {
    console.log(`error while adding the coupon`, error.message);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("admin/500");
  }
};

const loadEditCoupon = async (req, res) => {
  try {
    const { id: couponId } = req.params;

    const couponData = await coupons.findById(couponId);

    if (!couponData) {
      return res.status(statusCodes.BAD_REQUEST).render("admin/400");
    }
    return res.status(statusCode.OK).render("admin/editCoupon", { couponData });
  } catch (error) {
    console.log(`error while adding the coupon`, error.message);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("admin/500");
  }
};

const editCoupon = async (req, res) => {
  try {
    const { id: couponId } = req.params;

    const {
      couponName,
      couponDescription,
      couponCode,
      couponDiscount,
      maxAmount,
      minAmount,
      couponStatus,
    } = req.body;

    const calculatedMax = Math.floor(
      Number(minAmount) * Number(couponDiscount / 100)
    );

    if (Number(maxAmount) <= calculatedMax) {
      return res.status(statusCode.BAD_REQUEST).render("admin/addCoupon", {
        message: `Maximum Discount Amount cannot be less than the calculated maximum discount of ${calculatedMax}`,
      });
    }

    const exists = await coupons.findOne({
      couponName: { $regex: new RegExp(`^${couponName}$`, "i") },
      _id: { $ne: couponId },
    });

    if (exists) {
      return res.status(statusCode.BAD_REQUEST).json({
        message: "Coupon Name already exists",
        success: false,
        couponNameExists: exists,
      });
    }

    const updatedCoupon = await coupons.findByIdAndUpdate(
      couponId,
      {
        couponName,
        couponDescription,
        couponCode,
        couponDiscount,
        maxAmount,
        minAmount,
        couponStatus,
      },
      { new: true }
    );

    if (!updatedCoupon) {
      return res.status(statusCode.NOT_FOUND).json({
        message: "Coupon not found",
        success: false,
      });
    }

    return res.status(statusCode.OK).json({
      message: "Coupon updated successfully",
      success: true,
      updatedCoupon,
    });
  } catch (error) {
    console.log(`error while adding the coupon`, error.message);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("admin/500");
  }
};

const addCoupon = async (req, res) => {
  try {
    const {
      couponName,
      couponDescription,
      couponCode,
      couponDiscount,
      maxAmount,
      minAmount,
      couponStatus,
    } = req.body;

    const calculatedMax = Math.floor(
      Number(minAmount) * Number(couponDiscount / 100)
    );

    if (Number(maxAmount) <= calculatedMax) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: `Maximum Discount Amount cannot be less than the calculated maximum discount of ${calculatedMax}`,
      });
    }
    const existingCouponName = await coupons.findOne({
      couponName: { $regex: new RegExp(`^${couponName}$`, "i") },
    });

    if (existingCouponName) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message:
          "Coupon name already exists. Please choose a different coupon name.",
        couponNameExists: existingCouponName,
      });
    }
    const existingCouponCode = await coupons.findOne({
      couponCode: { $regex: new RegExp(`^${couponCode}$`, "i") },
    });

    if (existingCouponCode) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: "Coupon code already exists. Please choose a different code.",
        couponCodeExists: existingCouponCode,
      });
    }

    const coupon = new coupons({
      couponName: couponName,
      couponDescription: couponDescription,
      couponCode: couponCode,
      couponDiscount: couponDiscount,
      maxAmount: maxAmount,
      minAmount: minAmount,
      couponStatus: couponStatus,
    });

    const couponData = coupon.save();
    if (couponData) {
      return res.status(statusCode.OK).json({
        success: true,
        message: "Coupon added successfully.",
        data: couponData,
      });
    }

    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "There was an issue saving the coupon. Please try again.",
    });
  } catch (error) {
    console.log(`error while adding the coupon`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("admin/500");
  }
};

const activateDeactivateCoupon = async (req, res) => {
  const { id: couponId } = req.params;
  try {
    const couponData = await coupons.findById(couponId);

    if (!couponData) {
      return res
        .status(statusCode.NOT_FOUND)
        .json({ success: false, message: "Coupon not found" });
    }

    const newStatus = !couponData.couponStatus;
    const updatedCouponStatus = await coupons.findByIdAndUpdate(
      couponId,
      { $set: { couponStatus: newStatus } },
      { new: true }
    );

    return res.status(statusCode.OK).json({
      success: true,
      message: `Coupon status set to ${newStatus ? "active" : "inactive"}`,
      couponData: updatedCouponStatus,
    });
  } catch (error) {
    console.log(
      `error while while blocking or unblocking the coupon`,
      error.message
    );
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "error while updating the coupon status",
    });
  }
};

module.exports = {
  //user side
  applyCoupon,
  removeCoupon,

  //admin side
  loadCoupon,
  loadAddCoupon,
  addCoupon,
  loadEditCoupon,
  editCoupon,
  activateDeactivateCoupon,
};
