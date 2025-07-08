const categoryBrandController = require("../categoryBrandController");

const handleSoftDelete = (req, res) => {
  if (req.query.categoryId) {
    return categoryBrandController.softDeleteCategory(req, res);
  } else if (req.query.brandId) {
    return categoryBrandController.softDeleteBrand(req, res);
  }
};

module.exports = {
  handleSoftDelete,
};
