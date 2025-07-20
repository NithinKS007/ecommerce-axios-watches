const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const categories = require("../models/categoryModel");
const products = require("../models/productModel");
const statusCode = require("../utils/statusCodes");

const loadCategoryOffer = async (req, res) => {
  let pageNumber = parseInt(req.query.page) || 1;
  const perPageData = 5;
  const skip = (pageNumber - 1) * perPageData;

  try {
    const [totalOfferAppliedCategories, offerAppliedCategories] =
      await Promise.all([
        categories.countDocuments({
          categoryOffer: { $ne: null, $exists: true },
        }),

        categories
          .find({ categoryOffer: { $ne: null, $exists: true } })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(perPageData)
          .exec(),
      ]);

    const totalPages = Math.max(
      1,
      Math.ceil(totalOfferAppliedCategories / perPageData)
    );

    pageNumber = Math.max(1, Math.min(pageNumber, totalPages));

    return res.status(statusCode.OK).render("admin/categoryOfferList", {
      offerAppliedCategories: offerAppliedCategories,
      totalPages: totalPages,
      currentPage: pageNumber,
    });
  } catch (error) {
    console.log(
      `Error while loading the offer applying to category page:`,
      error.message
    );
    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("admin/500");
  }
};

const loadAddCategoryOffer = async (req, res) => {
  try {
    const currentDate = new Date();

    const categoriesWithProducts = await products.distinct("category");

    const categoriesData = await categories.find({
      $or: [
        { "categoryOffer.offerExpiryDate": { $lt: currentDate } },
        { categoryOffer: { $exists: false } },
      ],
      _id: { $in: categoriesWithProducts },
    });

    return res
      .status(statusCode.OK)
      .render("admin/addCategoryOffer", { categoriesData: categoriesData });
  } catch (error) {
    console.log(
      `error while loading the offer applying to category page`,
      error.message
    );
    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("admin/500");
  }
};

const addCategoryOffer = async (req, res) => {
  try {
    const { offerName, category, discountPercentage, startDate, expiryDate } =
      req.body;

    if (
      !offerName ||
      !category ||
      !discountPercentage ||
      !startDate ||
      !expiryDate
    ) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ success: false, message: "All fields are required" });
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: "Discount percentage must be between 0 and 100.",
      });
    }

    if (new Date(startDate) < new Date()) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ success: false, message: "Start date cannot be in the past." });
    }
    if (expiryDate && new Date(expiryDate) <= new Date(startDate)) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: "Expiry date must be after the start date.",
      });
    }

    const categoryId = ObjectId.createFromHexString(category);

    const categoryData = await categories.findById(categoryId);

    if (!categoryData) {
      return res
        .status(statusCode.NOT_FOUND)
        .json({ success: false, message: "Category not found" });
    }

    const productsData = await products.find({ category: categoryId });

    if (!productsData) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: "Sorry no products are found in this category",
      });
    }

     const offerNameExists = await categories.findOne({
      "categoryOffer.offerName": { $regex: new RegExp(`^${offerName}$`, "i") },
    });

    if (offerNameExists) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message:
          "Offer name already exists. Please choose a different Offer name.",
        offerNameExists: offerNameExists,
      });
    }

    await categories.findByIdAndUpdate(
      { _id: categoryId },
      {
        $set: {
          "categoryOffer.offerName": offerName,
          "categoryOffer.offerDiscountPercentage": discountPercentage,
          "categoryOffer.offerStartDate": startDate,
          "categoryOffer.offerExpiryDate": expiryDate,
          "categoryOffer.offerStatus": true,
        },
      },
      { new: true }
    );

    productsData.forEach(async (product) => {
      const originalPriceOfTheProduct = product.salesPrice;
      const newDiscountedPriceAfterApplyingCategoryOffer =
        originalPriceOfTheProduct -
        originalPriceOfTheProduct * (discountPercentage / 100);

      if (
        product.productSalesPriceAfterOfferDiscount >
        newDiscountedPriceAfterApplyingCategoryOffer
      ) {
        await products.findByIdAndUpdate(
          { _id: product._id },
          {
            $set: {
              productSalesPriceAfterOfferDiscount:
                newDiscountedPriceAfterApplyingCategoryOffer,
              "productOffer.offerDiscountPercentage": discountPercentage,
              "productOffer.offerStartDate": startDate,
              "productOffer.offerExpiryDate": expiryDate,
              "productOffer.offerStatus": true,
            },
          },
          { new: true }
        );
      }
    });

    return res
      .status(statusCode.OK)
      .json({ success: true, message: "Category Offer added successfully" });
  } catch (error) {
    console.log(`error while adding offer to category`, error.message);

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};

const activateDeactivateCategoryOffer = async (req, res) => {
  try {
    const { id: categoryId } = req.params;

    const categoryData = await categories.findById(categoryId);

    if (!categoryData) {
      return res
        .status(statusCode.NOT_FOUND)
        .json({ success: false, message: "Category not found" });
    }

    const newOfferStatus = !categoryData.categoryOffer.offerStatus;

    const updatedCategoryOfferStatus = await categories.findByIdAndUpdate(
      categoryId,
      { "categoryOffer.offerStatus": newOfferStatus },
      { new: true }
    );

    const productsInCategory = await products.find({ category: categoryId });

    for (const product of productsInCategory) {
      let salesPrice = product.salesPrice;
      let categoryOfferdiscountAmount =
        (categoryData.categoryOffer.offerDiscountPercentage / 100) * salesPrice;
      let discountedPrice = salesPrice - categoryOfferdiscountAmount;

      if (discountedPrice === product.productSalesPriceAfterOfferDiscount) {
        await products.findByIdAndUpdate(
          product._id,
          {
            "productOffer.offerStatus": newOfferStatus,
          },
          { new: true }
        );
      }
    }

    return res.status(statusCode.OK).json({
      success: true,
      message: `Category offer status set to ${newOfferStatus}`,
      updatedCategoryOfferStatus: updatedCategoryOfferStatus,
    });
  } catch (error) {
    console.log(
      `error while changing the status of the category offer`,
      error.message
    );
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: true,
      message: "Internal server error",
    });
  }
};

const loadEditCategoryOffer = async (req, res) => {
  try {
    const { categoryId } = req.query;

    const categoryData = await categories.findById(categoryId);

    return res
      .status(statusCode.OK)
      .render("admin/editCategoryOffer", { categoryData: categoryData });
  } catch (error) {
    console.log(
      `error while loading the editing page of the category offer`,
      error.message
    );
    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("admin/500");
  }
};

const editCategoryOffer = async (req, res) => {
  try {
    const { id: categoryId } = req.params;
    const { offerName, discountPercentage, expiryDate } = req.body;

    if (!categoryId || !offerName || !discountPercentage || !expiryDate) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ success: false, message: "All fields are required" });
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: "Discount percentage must be between 0 and 100",
      });
    }

    if (expiryDate <= new Date()) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ success: false, message: "Expiry date must be in the future" });
    }

    const categoryData = await categories.findById(categoryId);

    if (!categoryData) {
      return res
        .status(statusCode.NOT_FOUND)
        .json({ success: false, message: "Category not found" });
    }

    const productsData = await products.find({ category: categoryId });

    if (!productsData.length) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: "No products found in this category",
      });
    }

    const offerNameExists = await categories.findOne({
      "categoryOffer.offerName": { $regex: new RegExp(`^${offerName}$`, "i") },
    });

    if (offerNameExists) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message:
          "Offer name already exists. Please choose a different Offer name.",
        offerNameExists: offerNameExists,
      });
    }

    await categories.findByIdAndUpdate(
      { _id: categoryId },
      {
        $set: {
          "categoryOffer.offerName": offerName,
          "categoryOffer.offerDiscountPercentage": discountPercentage,
          "categoryOffer.offerExpiryDate": expiryDate,
        },
      },
      { new: true }
    );
    productsData.forEach(async (product) => {
      const originalPriceOfTheProduct = product.salesPrice;
      const newDiscountedPriceAfterApplyingCategoryOffer =
        originalPriceOfTheProduct -
        originalPriceOfTheProduct * (discountPercentage / 100);

      if (
        product.productSalesPriceAfterOfferDiscount >
        newDiscountedPriceAfterApplyingCategoryOffer
      ) {
        await products.findByIdAndUpdate(
          { _id: product._id },
          {
            $set: {
              productSalesPriceAfterOfferDiscount:
                newDiscountedPriceAfterApplyingCategoryOffer,
              "productOffer.offerDiscountPercentage": discountPercentage,
              "productOffer.offerExpiryDate": expiryDate,
            },
          },
          { new: true }
        );
      }
    });

    return res
      .status(statusCode.OK)
      .json({ success: true, message: "Category offer edited successfully" });
  } catch (error) {
    console.log(`error while editing the category offer`, error.message);
    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occured while editing the category offer" });
  }
};

const loadProductOffer = async (req, res) => {
  let pageNumber = parseInt(req.query.page) || 1;
  const perPageData = 5;
  const skip = (pageNumber - 1) * perPageData;
  try {
    const [totalOfferAppliedProducts, offerAppliedProducts] = await Promise.all(
      [
        products.countDocuments({
          productOffer: { $exists: true, $ne: null },
        }),
        products
          .find({
            productOffer: { $exists: true, $ne: null },
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(perPageData)
          .exec(),
      ]
    );
    const totalPages = Math.max(
      1,
      Math.ceil(totalOfferAppliedProducts / perPageData)
    );
    pageNumber = Math.max(1, Math.min(pageNumber, totalPages));
    return res.status(statusCode.OK).render("admin/productOfferList", {
      offerAppliedProducts: offerAppliedProducts,
      totalPages: totalPages,
      currentPage: pageNumber,
    });
  } catch (error) {
    console.log(
      `Error while loading the offer applied products page:`,
      error.message
    );
    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("admin/500");
  }
};

const loadAddProductOffer = async (req, res) => {
  try {
    const currentDate = new Date();
    const productsData = await products.find({
      $or: [
        { "productOffer.offerExpiryDate": { $lt: currentDate } },
        { productOffer: { $exists: false } },
      ],
    });

    return res
      .status(statusCode.OK)
      .render("admin/addProductOffer", { productsData: productsData });
  } catch (error) {
    console.log(
      `error while loading the offer applying to category page`,
      error.message
    );

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("admin/500");
  }
};
const addProductOffer = async (req, res) => {
  try {
    const { offerName, product, discountPercentage, startDate, expiryDate } =
      req.body;

    if (
      !offerName ||
      !product ||
      !discountPercentage ||
      !startDate ||
      !expiryDate
    ) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ success: false, message: "All fields are required" });
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: "Discount percentage must be between 0 and 100.",
      });
    }

    if (new Date(startDate) < new Date()) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ success: false, message: "Start date cannot be in the past." });
    }
    if (expiryDate && new Date(expiryDate) <= new Date(startDate)) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: "Expiry date must be after the start date.",
      });
    }

    const productId = ObjectId.createFromHexString(product);

    const productData = await products.findById(productId);

    if (!productData) {
      return res
        .status(statusCode.NOT_FOUND)
        .json({ success: false, message: "Product not found" });
    }

    const categoryData = await categories.findOne({
      _id: productData.category,
    });

    if (!categoryData) {
      return res.status(statusCode.NOT_FOUND).json({
        success: false,
        message:
          "No category found with the associated product for checking which offer is better",
      });
    }

    const offerNameExists = await products.findOne({
      "productOffer.offerName": { $regex: new RegExp(`^${offerName}$`, "i") },
    });

    if (offerNameExists) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message:
          "Offer name already exists. Please choose a different Offer name.",
        offerNameExists: offerNameExists,
      });
    }

    if (
      discountPercentage <=
        categoryData?.categoryOffer?.offerDiscountPercentage &&
      new Date(categoryData?.categoryOffer?.offerExpiryDate) > new Date()
    ) {
      return res.status(statusCode.OK).json({
        BetterOfferApplied: true,
        message: "product already has a better offer and is not expired",
      });
    }

    const discountAmount = (productData.salesPrice * discountPercentage) / 100;

    await products.findOneAndUpdate(
      { _id: productId },
      {
        $set: {
          "productOffer.offerName": offerName,
          "productOffer.offerDiscountPercentage": discountPercentage,
          "productOffer.offerDiscountAmount": discountAmount,
          "productOffer.offerStartDate": startDate,
          "productOffer.offerExpiryDate": expiryDate,
          "productOffer.offerStatus": true,
          productSalesPriceAfterOfferDiscount:
            productData.salesPrice - discountAmount,
        },
      },

      { new: true }
    );

    return res
      .status(statusCode.OK)
      .json({ success: true, message: "Product Offer added successfully" });
  } catch (error) {
    console.log(`error while adding offer to product`, error.message);

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};
const activateDeactivateProductOffer = async (req, res) => {
  try {
    const { id: productId } = req.params;

    const productData = await products.findById(productId);

    if (!productData) {
      return res
        .status(statusCode.NOT_FOUND)
        .json({ success: false, message: "Product not found" });
    }

    if (productData.productOffer.offerStatus) {
      const updatedProductOfferStatus = await products.findByIdAndUpdate(
        { _id: productId },
        { $set: { "productOffer.offerStatus": false } },
        { new: true }
      );

      return res.status(statusCode.OK).json({
        success: true,
        message: "product offer status set to false",
        updatedProductOfferStatus: updatedProductOfferStatus,
      });
    } else {
      const updatedProductOfferStatus = await products.findByIdAndUpdate(
        { _id: productId },
        { $set: { "productOffer.offerStatus": true } },
        { new: true }
      );

      return res.status(statusCode.OK).json({
        success: true,
        message: "product offer status set to true",
        updatedProductOfferStatus: updatedProductOfferStatus,
      });
    }
  } catch (error) {
    console.log(
      `error while changing the status of the product offer`,
      error.message
    );
    return res.status(statusCode.OK).json({
      success: false,
      message: "error while changing the status of the product offer",
    });
  }
};
const loadEditProductOffer = async (req, res) => {
  try {
    const { productId } = req.query;

    const productData = await products.findById(productId);

    return res
      .status(statusCode.OK)
      .render("admin/editProductOffer", { productData: productData });
  } catch (error) {
    console.log(`error while loading the product offer`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("admin/500");
  }
};
const editProductOffer = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { offerName, discountPercentage, expiryDate } = req.body;

    if (!productId || !offerName || !discountPercentage || !expiryDate) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ success: false, message: "All fields are required" });
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: "Discount percentage must be between 0 and 100",
      });
    }

    if (expiryDate <= new Date()) {
      return res
        .status(statusCode.BAD_REQUEST)
        .json({ success: false, message: "Expiry date must be in the future" });
    }

    const productGivenId = ObjectId.createFromHexString(productId);

    const productData = await products.findById(productGivenId);

    if (!productData) {
      return res
        .status(statusCode.NOT_FOUND)
        .json({ success: false, message: "Product not found" });
    }

    const categoryData = await categories.findOne({
      _id: productData.category,
    });

    if (!categoryData) {
      return res.status(statusCode.NOT_FOUND).json({
        success: false,
        message:
          "No category found with the associated product for checking which offer is better",
      });
    }

     const offerNameExists = await products.findOne({
      "productOffer.offerName": { $regex: new RegExp(`^${offerName}$`, "i") },
    });

    if (offerNameExists) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message:
          "Offer name already exists. Please choose a different Offer name.",
        offerNameExists: offerNameExists,
      });
    }

    if (
      discountPercentage <=
        categoryData?.categoryOffer?.offerDiscountPercentage &&
      new Date(categoryData?.categoryOffer?.offerExpiryDate) > new Date()
    ) {
      return res.status(statusCode.OK).json({
        BetterOfferApplied: true,
        message: "product already has a better offer and is not expired",
      });
    }

    const discountAmount = (productData.salesPrice * discountPercentage) / 100;

    const updatedProduct = await products.findOneAndUpdate(
      { _id: productId },
      {
        $set: {
          "productOffer.offerName": offerName,
          "productOffer.offerDiscountPercentage": discountPercentage,
          "productOffer.offerDiscountAmount": discountAmount,
          "productOffer.offerExpiryDate": expiryDate,
          productSalesPriceAfterOfferDiscount:
            productData.salesPrice - discountAmount,
        },
      },

      { new: true }
    );

    return res.status(statusCode.OK).json({
      success: true,
      message: "Product offer updated successfully",
      updatedProduct,
    });
  } catch (error) {
    console.log(`error while editing the product offer`, error.message);

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};

module.exports = {
  loadCategoryOffer,
  loadAddCategoryOffer,
  loadProductOffer,
  loadAddProductOffer,
  loadEditCategoryOffer,
  loadEditProductOffer,

  addCategoryOffer,
  activateDeactivateCategoryOffer,
  editCategoryOffer,
  addProductOffer,
  activateDeactivateProductOffer,
  editProductOffer,
};
