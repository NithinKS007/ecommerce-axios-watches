const categories = require("../models/categoryModel");
const brands = require("../models/brandModel");
const products = require("../models/productModel");

const loadProducts = async (req, res) => {
  let pageNumber = parseInt(req.query.page) || 1;
  const perPageData = 5;
  const skip = (pageNumber - 1) * perPageData;

  const categoryFilter = req.query.category || "";
  const brandFilter = req.query.brand || "";
  const statusFilter = req.query.status || "";
  const searchTerm = (req.query.searchTerm || "").trim();

  try {
    let query = {};

    if (categoryFilter) {
      query.category = categoryFilter;
    }

    if (brandFilter) {
      query.brand = brandFilter;
    }

    if (statusFilter === "inStock") {
      query.stock = { $gt: 0 };
    } else if (statusFilter === "outOfStock") {
      query.stock = { $eq: 0 };
    } else if (statusFilter === "unListed") {
      query.isBlocked = true;
    }

    if (searchTerm) {
      query.name = { $regex: searchTerm, $options: "i" };
    }

    const totalProducts = await products.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(totalProducts / perPageData));

    pageNumber = Math.max(1, Math.min(pageNumber, totalPages));

    const [productData, categoriesData, brandsData] = await Promise.all([
      products
        .find(query)
        .populate("brand")
        .populate("category")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPageData)
        .exec(),

      categories.find({}).sort({ createdAt: -1 }),
      brands.find({}).sort({ createdAt: -1 }),
    ]);

    return res.status(200).render("admin/productList", {
      productData: productData,
      categoriesData: categoriesData,
      brandsData: brandsData,
      totalPages: totalPages,
      currentPage: pageNumber,
      categoryFilter: categoryFilter,
      brandFilter: brandFilter,
      statusFilter: statusFilter,
      searchTerm: searchTerm,
    });
  } catch (error) {
    console.log("Error while loading the products page:", error.message);

    return res.status(500).render("admin/500");
  }
};

const loadaddProduct = async (req, res) => {
  try {
    const [categoriesData, brandsData] = await Promise.all([
      categories.find({ isBlocked: false }),
      brands.find({ isBlocked: false }),
    ]);

    return res
      .status(200)
      .render("admin/addProduct", { categoriesData, brandsData });
  } catch (error) {
    console.log(`error while loading add product page `);

    return res.status(500).render("admin/500");
  }
};

const addProduct = async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      dialShape,
      displayType,
      salesPrice,
      strapMaterial,
      strapColor,
      stock,
      description,
      targetGroup,
    } = req.body;

    if (
      !name ||
      !brand ||
      !category ||
      !dialShape ||
      !displayType ||
      !salesPrice ||
      !strapMaterial ||
      !strapColor ||
      !stock ||
      !description ||
      !targetGroup
    ) {
      return res
        .status(400)
        .json({ message: "All fields are required", success: false });
    }

    const brandFromCollection = await brands.findOne({ name: brand });
    const categoryFromCollection = await categories.findOne({ name: category });

    if (!brandFromCollection) {
      return res
        .status(400)
        .json({ message: "Brand not found", success: false });
    }
    if (!categoryFromCollection) {
      return res
        .status(400)
        .json({ message: "Category not found", success: false });
    }

    const product = new products({
      name: name,
      brand: brandFromCollection._id,
      category: categoryFromCollection._id,
      dialShape: dialShape,
      displayType: displayType,
      salesPrice: salesPrice,
      strapMaterial: strapMaterial,
      strapColor: strapColor,
      stock: stock,
      description: description,
      targetGroup: targetGroup,
      images: req.files,
    });

    await product.save();

    return res
      .status(200)
      .json({ message: "Product upload successfully", success: true });
  } catch (error) {
    console.log(`cannot add the products `, error.message);

    return res
      .status(500)
      .json({ message: "Error while uploading products", success: false });
  }
};

const softDeleteProduct = async (req, res) => {
  const productId = req.query.productId;

  try {
    const productData = await products.findById(productId);

    if (!productData) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (productData.isBlocked) {
      const updatedProduct = await products.findByIdAndUpdate(
        { _id: productId },
        { $set: { isBlocked: false } },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "product successfully soft deleted",
        productId: updatedProduct,
      });
    } else {
      const updatedProduct = await products.findByIdAndUpdate(
        { _id: productId },
        { $set: { isBlocked: true } },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "undone product soft deletion",
        productId: updatedProduct,
      });
    }
  } catch (error) {
    console.log(`error while deleting the product`, error.message);

    return res.status(500).json({
      success: false,
      message: "error while deleting the product",
    });
  }
};

const loadEditProduct = async (req, res) => {
  try {
    const { productId } = req.query;

    const [categoriesData, brandsData, productDataToEdit] = await Promise.all([
      categories.find({}),
      brands.find({}),
      products
        .findOne({ _id: productId })
        .populate("category")
        .populate("brand"),
    ]);

    return res
      .status(200)
      .render("admin/editProduct", {
        categoriesData,
        brandsData,
        productDataToEdit,
      });
  } catch (error) {
    console.log(`error while loading the edit product page`, error.message);

    return res.status(500).render("admin/500");
  }
};

const editProduct = async (req, res) => {
  try {
    const {
      productId,
      name,
      brand,
      category,
      dialShape,
      displayType,
      salesPrice,
      strapMaterial,
      strapColor,
      stock,
      description,
      targetGroup,
    } = req.body;

    const images = req.files;

    const existingProduct = await products.findById(productId);

    if (!existingProduct) {
      return res
        .status(404)
        .json({ message: "Product not found", success: false });
    }

    const updatedData = {
      name,
      brand,
      category,
      dialShape,
      displayType,
      salesPrice,
      strapMaterial,
      strapColor,
      stock,
      description,
      targetGroup,
    };

    const updatedProductDetails = await products.findByIdAndUpdate(
      productId,
      { $set: updatedData },
      { new: true }
    );

    if (!updatedProductDetails) {
      return res
        .status(404)
        .json({
          message: "Product cannot be updated",
          success: false,
          updatedProductName: updatedProductDetails.name,
        });
    }

    if (images && images.length > 0) {
      await products.findByIdAndUpdate(
        productId,
        { $push: { images: { $each: images } } },
        { new: true }
      );
    }

    return res
      .status(200)
      .json({
        message: "Product updated successfully",
        success: true,
        updatedProductName: updatedProductDetails.name,
      });
  } catch (error) {
    console.log(`Error while editing the product data:`, error.message);

    return res
      .status(500)
      .json({ message: "Failed to update product", success: false });
  }
};

const editImage = async (req, res) => {
  try {
    const { productId, imageName } = req.body;

    if (productId && imageName) {
      await products.updateOne(
        { _id: productId },
        { $pull: { images: { filename: imageName } } }
      );

      return res
        .status(200)
        .json({ message: "Product Image successfully removed", success: true });
    }

    return res
      .status(400)
      .json({ message: "Failed to remove product image", success: false });
  } catch (error) {
    console.log(`error while removing the image`, error.message);

    return res
      .status(500)
      .json({ message: "Failed to update product image", success: false });
  }
};

const ProductExists = async (req, res) => {
  const { encodedPName, productId } = req.query;

  try {
    const query = { name: encodedPName };

    if (productId) {
      query._id = { $ne: productId };
    }

    const exists = await products.findOne(query);

    if (exists) {
      return res
        .status(200)
        .json({ message: "Product already exists", exists: true });
    }

    return res
      .status(200)
      .json({ message: "Product does not exist", exists: false });
  } catch (error) {
    console.log(`error while checking the existing product`, error.message);

    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  loadProducts,
  loadaddProduct,
  loadEditProduct,
  addProduct,
  editProduct,
  editImage,
  softDeleteProduct,
  ProductExists,
};
