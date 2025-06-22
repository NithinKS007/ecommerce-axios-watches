const categories = require("../models/categoryModel");
const brands = require("../models/brandModel");

const escapeRegExp = require("../utils/escapeSpecialChars");
const statusCode = require("../utils/statusCodes");

const loadCategoryBrand = async (req, res) => {
  try {
    const [categoriesData, brandsData] = await Promise.all([
      categories.find({}).sort({ createdAt: -1 }).exec(),
      brands.find({}).sort({ createdAt: -1 }).exec(),
    ]);

    return res
      .status(statusCode.OK)
      .render("admin/brandCategoryManagement", { categoriesData, brandsData });
  } catch (error) {
    console.log(`cannot load the category page`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("admin/500");
  }
};

const addCategoryBrand = async (req, res) => {
  const { cName, cDescription } = req.body;
  const { bName } = req.body;

  if (cName && cDescription) {
    try {
      const category = new categories({
        name: cName.trim(),
        description: cDescription.trim(),
      });

      await category.save();

      return res
        .status(statusCode.CREATED)
        .redirect("/admin/brandCategoryManagement");
    } catch (error) {
      console.log(`error adding the category`, error.message);

      return res.status(statusCode.INTERNAL_SERVER_ERROR).render("admin/500");
    }
  } else if (bName) {
    try {
      const brand = new brands({
        name: bName.trim(),
      });

      await brand.save();

      return res
        .status(statusCode.CREATED)
        .redirect("/admin/brandCategoryManagement");
    } catch (error) {
      console.log(`error adding the brand`, error.message);

      return res.status(statusCode.INTERNAL_SERVER_ERROR).render("admin/500");
    }
  }
};

const editCategory = async (req, res) => {
  const { categoryId, name, description } = req.body;

  if (!categoryId || !name || !description) {
    return res.status(statusCode.BAD_REQUEST).json({
      success: false,
      message: "Category id, name, description are required",
    });
  }

  try {
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
  const { brandId, name } = req.body;

  if (!brandId || !name) {
    return res
      .status(statusCode.BAD_REQUEST)
      .json({ success: false, message: "Brand id and name are required" });
  }

  try {
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
  const categoryId = req.query.categoryId;

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
  const brandId = req.query.brandId;

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

const categoryExists = async (req, res) => {
  const { encodedCName, categoryId } = req.query;

  const decodedCName = decodeURIComponent(encodedCName);
  const escapedCName = escapeRegExp(decodedCName);

  try {
    const query = { name: { $regex: new RegExp(`^${escapedCName}`, "i") } };

    if (categoryId) {
      query._id = { $ne: categoryId };
    }

    const exist = await categories.findOne(query);

    if (exist) {
      return res
        .status(statusCode.OK)
        .json({ message: "Category already exists", exists: true });
    }

    return res
      .status(statusCode.OK)
      .json({ message: "Category does not exist", exists: false });
  } catch (error) {
    console.log("Error while checking the existing category:", error.message);

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};

const brandExists = async (req, res) => {
  const { encodedBName, brandId } = req.query;

  const escapedBName = escapeRegExp(encodedBName);

  try {
    const query = { name: { $regex: new RegExp(`^${escapedBName}`, "i") } };

    if (brandId) {
      query._id = { $ne: brandId };
    }

    const exists = await brands.findOne(query);

    if (exists) {
      return res
        .status(statusCode.OK)
        .json({ message: "Brand already exists", exists: true });
    }

    return res
      .status(statusCode.OK)
      .json({ message: "Brand does not exist", exists: false });
  } catch (error) {
    console.log(`error while checking the existing brand`, error.message);

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};

module.exports = {
  loadCategoryBrand,
  addCategoryBrand,
  editCategory,
  editBrand,
  softDeleteCategory,
  softDeleteBrand,
  categoryExists,
  brandExists,
};
