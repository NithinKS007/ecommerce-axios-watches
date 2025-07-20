const categories = require("../models/categoryModel");
const brands = require("../models/brandModel");
const statusCode = require("../utils/statusCodes");
const statusCodes = require("../utils/statusCodes");

const loadCategoryBrand = async (req, res) => {
  try {
    const categoryPage = Math.max(1, parseInt(req.query.categoryPage) || 1);
    const brandPage = Math.max(1, parseInt(req.query.brandPage) || 1);
    const perPageData = 5;

    const categorySkip = (categoryPage - 1) * perPageData;
    const categoriesData = await categories
      .find({})
      .skip(categorySkip)
      .limit(perPageData)
      .sort({ createdAt: -1 })
      .exec();
    const categoryTotal = await categories.countDocuments();
    const categoryTotalPages = Math.max(
      1,
      Math.ceil(categoryTotal / perPageData)
    );
    const categoryCurrentPage = Math.max(
      1,
      Math.min(categoryPage, categoryTotalPages)
    );

    const brandSkip = (brandPage - 1) * perPageData;
    const brandsData = await brands
      .find({})
      .skip(brandSkip)
      .limit(perPageData)
      .sort({ createdAt: -1 })
      .exec();
    const brandTotal = await brands.countDocuments();
    const brandTotalPages = Math.max(1, Math.ceil(brandTotal / perPageData));
    const brandCurrentPage = Math.max(1, Math.min(brandPage, brandTotalPages));

    return res.status(statusCodes.OK).render("admin/brandCategoryManagement", {
      categoriesData,
      brandsData,
      categoryTotalPages,
      brandTotalPages,
      categoryCurrentPage,
      brandCurrentPage,
    });
  } catch (error) {
    console.log(`Cannot load the category/brand page`, error.message);
    return res.status(500).render("admin/500");
  }
};

const addCategory = async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    return res
      .status(statusCode.BAD_REQUEST)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const categoryExists = await categories.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (categoryExists) {
      return res.status(statusCode.BAD_REQUEST).json({
        message: "Category Name already exists",
        success: false,
        categoryNameExists: categoryExists,
      });
    }

    const category = new categories({
      name: name.trim(),
      description: description.trim(),
    });

    await category.save();

    return res
      .status(statusCode.CREATED)
      .json({ success: false, message: "Category created successfully" });
  } catch (error) {
    console.log(`error adding the category`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("admin/500");
  }
};

const addBrand = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res
      .status(statusCode.BAD_REQUEST)
      .json({ success: false, message: "All fields are required" });
  }
  try {
    const brandExists = await brands.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (brandExists) {
      return res.status(statusCode.BAD_REQUEST).json({
        message: "Brand Name already exists",
        success: false,
        brandNameExists: brandExists,
      });
    }

    const brand = new brands({
      name: name.trim(),
    });

    await brand.save();

    return res
      .status(statusCode.CREATED)
      .json({ success: false, message: "Brand created successfully" });
  } catch (error) {
    console.log(`error adding the brand`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("admin/500");
  }
};

const editCategory = async (req, res) => {
  const { id: categoryId } = req.params;
  const { name, description } = req.body;

  if (!categoryId || !name || !description) {
    return res.status(statusCode.BAD_REQUEST).json({
      success: false,
      message: "Category id, name, description are required",
    });
  }

  try {
    const categoryExists = await categories.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      _id: { $ne: categoryId },
    });

    if (categoryExists) {
      return res.status(statusCode.BAD_REQUEST).json({
        message: "Category Name already exists",
        success: false,
        categoryNameExists: categoryExists,
      });
    }
    const category = await categories.findById({ _id: categoryId });

    if (!category) {
      return res
        .status(statusCode.NOT_FOUND)
        .json({ success: false, message: "Category not found" });
    }

    const UpdatedCategory = await categories.findByIdAndUpdate(
      { _id: categoryId },
      { $set: { name: name, description: description } },
      { new: true }
    );

    if (UpdatedCategory) {
      return res.status(statusCode.OK).json({
        success: true,
        message: "category successfully edited",
        categoryDetails: UpdatedCategory,
      });
    }
  } catch (error) {
    console.log(`error while editing the category`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "error while editing the category",
    });
  }
};

const editBrand = async (req, res) => {
  const { id: brandId } = req.params;
  const { name } = req.body;

  if (!brandId || !name) {
    return res
      .status(statusCode.BAD_REQUEST)
      .json({ success: false, message: "Brand id and name are required" });
  }

  try {
    const brandExists = await brands.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      _id: { $ne: brandId },
    });

    if (brandExists) {
      return res.status(statusCode.BAD_REQUEST).json({
        message: "Brand Name already exists",
        success: false,
        brandNameExists: brandExists,
      });
    }
    const brand = await brands.findById({ _id: brandId });

    if (!brand) {
      return res
        .status(statusCode.NOT_FOUND)
        .json({ success: false, message: "Brand not found" });
    }

    const updatedBrand = await brands.findByIdAndUpdate(
      { _id: brandId },
      { $set: { name: name } },
      { new: true }
    );

    if (updatedBrand) {
      return res.status(statusCode.OK).json({
        success: true,
        message: "brand successfully edited",
        brandDetails: updatedBrand,
      });
    }
  } catch (error) {
    console.log(`error while editing the brand`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "error while editing the brand",
    });
  }
};

const softDeleteCategory = async (req, res) => {
  const { id: categoryId } = req.params;

  try {
    const category = await categories.findById({ _id: categoryId });

    if (!category) {
      return res
        .status(statusCode.NOT_FOUND)
        .json({ success: false, message: "Category not found" });
    }

    if (category.isBlocked) {
      const UpdatedCategory = await categories.findByIdAndUpdate(
        { _id: categoryId },
        { $set: { isBlocked: false } },
        { new: true }
      );

      return res.status(statusCode.OK).json({
        success: true,
        message: "category successfully soft deleted",
        categoryId: UpdatedCategory,
      });
    } else {
      const UpdatedCategory = await categories.findByIdAndUpdate(
        { _id: categoryId },
        { $set: { isBlocked: true } },
        { new: true }
      );

      return res.status(statusCode.OK).json({
        success: true,
        message: "undone category soft deletion",
        categoryId: UpdatedCategory,
      });
    }
  } catch (error) {
    console.log(`error while deleting the category`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "error while  deleting the category",
    });
  }
};

const softDeleteBrand = async (req, res) => {
  const { id: brandId } = req.params;

  try {
    const brandData = await brands.findById({ _id: brandId });

    if (!brandData) {
      return res
        .status(statusCode.NOT_FOUND)
        .json({ success: false, message: "Brand not found" });
    }

    if (brandData.isBlocked) {
      const updatedBrand = await brands.findByIdAndUpdate(
        { _id: brandId },
        { $set: { isBlocked: false } },
        { new: true }
      );

      return res.status(statusCode.OK).json({
        success: true,
        message: "brand successfully soft deleted",
        brandId: updatedBrand,
      });
    } else {
      const updatedBrand = await brands.findByIdAndUpdate(
        { _id: brandId },
        { $set: { isBlocked: true } },
        { new: true }
      );

      return res.status(statusCode.OK).json({
        success: true,
        message: "undone brand soft deletion",
        brandId: updatedBrand,
      });
    }
  } catch (error) {
    console.log(`error while deleting the brand`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "error while deleting the brand",
    });
  }
};

module.exports = {
  loadCategoryBrand,
  addCategory,
  addBrand,
  editCategory,
  editBrand,
  softDeleteCategory,
  softDeleteBrand,
};
