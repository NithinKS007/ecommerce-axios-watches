const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const products = require("../models/productModel");
const brands = require("../models/brandModel");
const categories = require("../models/categoryModel");
const cart = require("../models/cartModel");
const orders = require("../models/orderModel");
const wishList = require("../models/wishList");

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

    return res.status(200).render("user/home", {
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

    return res.status(500).render("user/500");
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
  const targetGroup = req.query.targetGroup;
  let pageNumber = parseInt(req.query.page) || 1;
  const perPageData = 9;

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
      products.countDocuments({ targetGroup: targetGroup }).exec(),
      products
        .find({ targetGroup: targetGroup })
        .populate("brand")
        .populate("category")
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * perPageData)
        .limit(perPageData)
        .exec(),
      products
        .find({ targetGroup: targetGroup })
        .populate("brand")
        .populate("category")
        .sort({ createdAt: -1 })
        .limit(10)
        .exec(),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalProducts / perPageData));
    pageNumber = Math.max(1, Math.min(pageNumber, totalPages));

    return res.status(200).render("user/showCase", {
      categoriesArray,
      brandArray,
      productsArray,
      latestProducts,
      targetGroup,
      totalPages,
      currentPage: pageNumber,
    });
  } catch (error) {
    console.log(`error while loading mens page`, error.message);

    return res.status(500).render("user/500");
  }
};

const advancedSearch = async (req, res) => {
  const { categories, brands, sortby, targetGroup } = req.query;

  const searchProduct = req.session.searchProduct || "";

  console.log("Search Product:", searchProduct);

  const categoriesArray = categories
    ? categories.split(",").map((id) => ObjectId.createFromHexString(id))
    : [];
  const brandsArray = brands
    ? brands.split(",").map((id) => ObjectId.createFromHexString(id))
    : [];
  const sortbyArray = sortby ? sortby.split(",") : [];

  const arrayToAggregate = [
    {
      $lookup: {
        from: "brands",
        localField: "brand",
        foreignField: "_id",
        as: "brandData",
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryData",
      },
    },
  ];

  let matchConditions = { isBlocked: false }  

  if (categoriesArray.length > 0) {
    matchConditions.category = { $in: categoriesArray };
  }

  if (brandsArray.length > 0) {
    matchConditions.brand = { $in: brandsArray };
  }

  if (targetGroup) {
    matchConditions.targetGroup = targetGroup;
  }

  if (searchProduct.trim()) {
    matchConditions.$or = [
      { name: { $regex: searchProduct, $options: "i" } },
      { "brandData.name": { $regex: searchProduct, $options: "i" } },
      { "categoryData.name": { $regex: searchProduct, $options: "i" } },
      { "categoryData.description": { $regex: searchProduct, $options: "i" } },
      { description: { $regex: searchProduct, $options: "i" } },
      { dialShape: { $regex: searchProduct, $options: "i" } },
      { displayType: { $regex: searchProduct, $options: "i" } },
      { strapMaterial: { $regex: searchProduct, $options: "i" } },
      { strapColor: { $regex: searchProduct, $options: "i" } },
      { targetGroup: { $regex: searchProduct, $options: "i" } },
    ];
  }

  if (sortbyArray.includes("priceLowHigh")) {
    arrayToAggregate.push({ $sort: { salesPrice: 1 } });
  } else if (sortbyArray.includes("priceHighLow")) {
    arrayToAggregate.push({ $sort: { salesPrice: -1 } });
  } else if (sortbyArray.includes("newArrivals")) {
    arrayToAggregate.push({ $sort: { createdAt: -1 } });
  } else if (sortbyArray.includes("aToZ")) {
    arrayToAggregate.push({ $sort: { name: 1 } });
  } else if (sortbyArray.includes("zToA")) {
    arrayToAggregate.push({ $sort: { name: -1 } });
  } else if (sortbyArray.includes("OutOfStock")) {
    arrayToAggregate.push({ $match: { stock: 0 } });
  }
  arrayToAggregate.unshift({ $match: matchConditions });
  try {
    let filterResult;
    if (arrayToAggregate.length >= 1) {
      filterResult = await products.aggregate(arrayToAggregate);
    } else {
      filterResult = await products.find({ isBlocked: false });
    }

    console.log(filterResult, "fiiter");
    return res.status(200).json({
      message: "Data received for filtering",
      success: true,
      data: filterResult,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error occurred during search",
      success: false,
      error: error.message,
    });
  }
};

const searchProducts = async (req, res) => {
  const { searchProduct = "", targetGroup } = req.query;
  req.session.searchProduct = searchProduct;
  let pageNumber = parseInt(req.query.page) || 1;
  const perPageData = 9;

  try {
    const categoriesArray = await categories.find({ isBlocked: false });
    const brandArray = await brands.find({ isBlocked: false });

    const arrayToAggregate = [];

    if (searchProduct) {
      arrayToAggregate.push({
        $match: {
          $or: [
            { name: { $regex: searchProduct, $options: "i" } },
            { description: { $regex: searchProduct, $options: "i" } },
            { dialShape: { $regex: searchProduct, $options: "i" } },
            { displayType: { $regex: searchProduct, $options: "i" } },
            { strapMaterial: { $regex: searchProduct, $options: "i" } },
            { strapColor: { $regex: searchProduct, $options: "i" } },
            { targetGroup: { $regex: searchProduct, $options: "i" } },
          ],
        },
      });
    }

    arrayToAggregate.push({
      $lookup: {
        from: "brands",
        localField: "brand",
        foreignField: "_id",
        as: "brandData",
      },
    });
    arrayToAggregate.push({
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryData",
      },
    });

    const query = targetGroup ? { targetGroup } : {};

    const totalProducts = await products.countDocuments({
      ...query,
      ...(searchProduct ? { $or: arrayToAggregate[0].$match.$or } : {}),
    });
    const totalPages = Math.max(1, Math.ceil(totalProducts / perPageData));

    pageNumber = Math.max(1, Math.min(pageNumber, totalPages));
    const skip = (pageNumber - 1) * perPageData;

    const productsArray = await products.aggregate([
      ...arrayToAggregate,
      {
        $match: {
          ...query,
          ...(searchProduct ? { $or: arrayToAggregate[0].$match.$or } : {}),
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: perPageData },
    ]);

    const latestProducts = await products
      .find(query)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("brand")
      .populate("category");

    return res.status(200).render("user/showCase", {
      productsArray,
      categoriesArray,
      brandArray,
      latestProducts,
      targetGroup,
      totalPages,
      currentPage: pageNumber,
      searchProduct,
    });
  } catch (error) {
    console.log(`Error while searching the products`, error.message);

    return res.status(500).render("user/500");
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
      }).limit(10)
      .populate("category")
      .populate("brand");

    if (!productDetails) {
      return res.status(404).send("product not found");
    }

    return res.status(200).render("user/productDetails", {
      productDetails,
      relatedProducts,
      existingCartItem,
      productInWishList,
    });
  } catch (error) {
    console.log(`error while loading the product details page`, error.message);

    return res.status(500).render("user/500");
  }
};

module.exports = {
  loadHome,
  loadShowCase,
  advancedSearch,
  searchProducts,
  loadProductDetails,
};
