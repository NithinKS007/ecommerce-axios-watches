const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const products = require("../models/productModel");
const brands = require("../models/brandModel");
const categories = require("../models/categoryModel");
const cart = require("../models/cartModel");
const orders = require("../models/orderModel");
const wishList = require("../models/wishList");
const statusCode = require("../utils/statusCodes");

const loadHome = async (req, res) => {
  let pageNumber = parseInt(req.query.page) || 1;
  const perPageData = 12;
  const currentDate = new Date();

  const skip = (pageNumber - 1) * perPageData;

  try {
    const [
      popularBrand,
      bestSellers,
      newArrivals,
      activeProductOffers,
      activeCategoryOffers,
      topDeals,
      totalProducts,
      categoryData,
      productsArray,
    ] = await Promise.all([
      getPopularBrands(),
      getBestSellers(),
      getNewArrivals(),
      getActiveProductOffers(currentDate),
      getActiveCategoryOffers(currentDate),
      getTopDeals(currentDate),
      products.countDocuments(),
      categories.find({}),
      products
        .find({})
        .populate("brand")
        .populate("category")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPageData)
        .exec(),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalProducts / perPageData));
    pageNumber = Math.max(1, Math.min(pageNumber, totalPages));

    const successMessage = req.session.successMessage;
    req.session.successMessage = null;

    return res.status(statusCode.OK).render("user/home", {
      productsArray,
      successMessage,
      totalPages,
      currentPage: pageNumber,
      bestSellers,
      newArrivals,
      activeProductOffers,
      activeCategoryOffers,
      categoryData,
      popularBrand,
      newArrivals,
      topDeals,
    });
  } catch (error) {
    console.log(
      `error while loading the home page before logging in`,
      error.message
    );

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("user/500");
  }
};

const getPopularBrands = async () => {
  try {
    return orders.aggregate([
      { $match: { orderStatus: "delivered" } },
      { $unwind: "$items" },
      { $match: { "items.orderProductStatus": "delivered" } },
      {
        $group: {
          _id: { brand: "$items.brand", product: "$items.productName" },

          totalSold: { $sum: "$items.quantity" },
        },
      },
      {
        $sort: { totalSold: -1 },
      },
      {
        $group: {
          _id: "$_id.brand",
          topProduct: { $first: "$_id.product" },
          totalSold: { $first: "$totalSold" },
          totalOrders: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "_id",
          foreignField: "_id",
          as: "brandDetails",
        },
      },
      { $unwind: "$brandDetails" },
      {
        $project: {
          brandName: "$brandDetails.name",
        },
      },

      { $sort: { totalSold: -1 } },
      { $limit: 4 },
    ]);
  } catch (error) {
    console.log(`error while fetching getPopularBrands`, error.message);
  }
};

const getBestSellers = async () => {
  try {
    return orders.aggregate([
      { $match: { orderStatus: "delivered" } },
      { $unwind: "$items" },
      { $match: { "items.orderProductStatus": "delivered" } },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
          productName: { $first: "$items.productName" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          productName: "$productDetails.name",
          firstImage: { $first: "$productDetails.images" },
          price: {
            $cond: {
              if: {
                $and: [
                  { $eq: ["$productDetails.productOffer.offerStatus", true] },
                  {
                    $lte: [
                      "$productDetails.productOffer.offerStartDate",
                      new Date(),
                    ],
                  },
                  {
                    $gte: [
                      "$productDetails.productOffer.offerExpiryDate",
                      new Date(),
                    ],
                  },
                ],
              },
              then: "$productDetails.productSalesPriceAfterOfferDiscount",
              else: "$productDetails.salesPrice",
            },
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 4 },
    ]);
  } catch (error) {
    console.log(`error while fetching getBestSellers`, error.message);
  }
};
const getNewArrivals = async () => {
  try {
    return products
      .find({})
      .sort({ createdAt: -1 })
      .limit(4)
      .populate("brand")
      .populate("category")
      .exec();
  } catch (error) {
    console.log(`error while fetching getNewArrivals`, error.message);
  }
};

const getActiveProductOffers = async (currentDate) => {
  try {
    return products
      .find({
        "productOffer.offerStatus": true,
        "productOffer.offerStartDate": { $lte: currentDate },
        "productOffer.offerExpiryDate": { $gte: currentDate },
      })
      .populate("brand")
      .populate("category")
      .limit(4)
      .exec();
  } catch (error) {
    console.log(`error while fetching getActiveProductOffers`, error.message);
  }
};
const getActiveCategoryOffers = async (currentDate) => {
  try {
    return categories
      .find({
        "categoryOffer.offerStatus": true,
        "categoryOffer.offerStartDate": { $lte: currentDate },
        "categoryOffer.offerExpiryDate": { $gte: currentDate },
      })
      .limit(4)
      .exec();
  } catch (error) {
    console.log(`error while fetching getActiveCategoryOffers`, error.message);
  }
};

const getTopDeals = async (currentDate) => {
  try {
    return products.aggregate([
      {
        $match: {
          "productOffer.offerExpiryDate": { $gte: currentDate },
          "productOffer.offerStatus": true,
        },
      },
      { $sort: { "productOffer.offerDiscountPercentage": -1 } },

      { $limit: 4 },
    ]);
  } catch (error) {
    console.log(`error while fetching getTopDeals`, error.message);
  }
};

const loadShowCase = async (req, res) => {
  const {
    searchProduct = "",
    targetGroup,
    category: categoryData,
    brand: brandsData,
    sortby: sortbyData,
  } = req.query;

  console.log("query", req.query);

  let pageNumber = parseInt(req.query.page) || 1;
  const perPageData = 9;
  let filter = {};
  let sort = { createdAt: -1 };
  let categoryList = [];
  if (categoryData) {
    categoryList = categoryData
      ? Array.isArray(categoryData)
        ? categoryData.map((id) => id)
        : [categoryData]
      : [];
  }

  let brandsList = [];
  if (brandsData) {
    brandsList = brandsData
      ? Array.isArray(brandsData)
        ? brandsData.map((id) => id)
        : [brandsData]
      : [];
  }

  let sortbyList = [];
  if (sortbyData) {
    sortbyList = sortbyData
      ? Array.isArray(sortbyData)
        ? sortbyData.map((sort) => sort)
        : [sortbyData]
      : [];
  }

  if (categoryList.length > 0) {
    filter.category = { $in: categoryList };
  }

  if (brandsList.length > 0) {
    filter.brand = { $in: brandsList };
  }

  if (targetGroup) {
    filter.targetGroup = targetGroup;
  }

  if (sortbyList.includes("priceLowHigh")) {
    sort = { salesPrice: 1 };
  } else if (sortbyList.includes("priceHighLow")) {
    sort = { salesPrice: -1 };
  } else if (sortbyList.includes("newArrivals")) {
    sort = { createdAt: -1 };
  } else if (sortbyList.includes("aToZ")) {
    sort = { name: 1 };
  } else if (sortbyList.includes("zToA")) {
    sort = { name: -1 };
  } else if (sortbyList.includes("outOfStock")) {
    filter.stock = 0; 
  }

  if (searchProduct) {
    filter.$or = [
      { name: { $regex: searchProduct, $options: "i" } },
      { description: { $regex: searchProduct, $options: "i" } },
      { dialShape: { $regex: searchProduct, $options: "i" } },
      { displayType: { $regex: searchProduct, $options: "i" } },
      { strapMaterial: { $regex: searchProduct, $options: "i" } },
      { strapColor: { $regex: searchProduct, $options: "i" } },
      { targetGroup: { $regex: searchProduct, $options: "i" } },
    ];
  }

  try {
    const [
      categoriesArray,
      brandArray,
      totalProducts,
      productsArray,
      latestProducts,
    ] = await Promise.all([
      categories.find({ isBlocked: false }).exec(),
      brands.find({ isBlocked: false }).exec(),
      products
        .countDocuments({ isBlocked: false, ...filter })
        .sort(sort)
        .exec(),
      products
        .find({ isBlocked: false, ...filter })
        .populate("brand")
        .populate("category")
        .sort(sort)
        .skip((pageNumber - 1) * perPageData)
        .limit(perPageData)
        .exec(),
      products
        .find({ isBlocked: false })
        .populate("brand")
        .populate("category")
        .sort({ createdAt: -1 })
        .limit(10)
        .exec(),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalProducts / perPageData));
    pageNumber = Math.max(1, Math.min(pageNumber, totalPages));

    console.log({ array: sortbyList });
    return res.status(statusCode.OK).render("user/showCase", {
      searchProduct,
      categoriesArray,
      brandArray,
      productsArray,
      latestProducts,
      targetGroup,
      totalPages,
      selectedCategories: categoryList,
      selectedBrands: brandsList,
      selectedSortList: sortbyList,
      currentPage: pageNumber,
    });
  } catch (error) {
    console.log(`error while loading mens page`, error.message);
    console.log("Error while loading men's page:", error.stack);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("user/500");
  }
};

const loadProductDetails = async (req, res) => {
  try {
    const productId = req.query.id;

    const currentUser = req?.currentUser;

    const [existingCartItem, productDetails, productInWishList] =
      await Promise.all([
        cart.findOne({
          user: currentUser?._id,
          items: { $elemMatch: { product: productId } },
        }),

        products
          .findById({ _id: productId })
          .populate("category")
          .populate("brand"),

        wishList.findOne({
          userId: currentUser?._id,

          productIds: { $in: [productId] },
        }),
      ]);

    const relatedProducts = await products
      .find({
        category: productDetails?.category,
        targetGroup: productDetails?.targetGroup,
      })
      .limit(10)
      .populate("category")
      .populate("brand");

    if (!productDetails) {
      return res.status(statusCode.NOT_FOUND).send("product not found");
    }

    return res.status(statusCode.OK).render("user/productDetails", {
      productDetails,
      relatedProducts,
      existingCartItem,
      productInWishList,
    });
  } catch (error) {
    console.log(`error while loading the product details page`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("user/500");
  }
};

module.exports = {
  loadHome,
  loadShowCase,
  // advancedSearch,
  // searchProducts,
  loadProductDetails,
};
