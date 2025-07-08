const categoryBrandController = require("../categoryBrandController");

const handleEditCategoryBrand = (req, res) => {
  if (req.body.categoryId) {
    return categoryBrandController.editCategory(req, res);
  } else if (req.body.brandId) {
    return categoryBrandController.editBrand(req, res);
  }
};

module.exports = {
  handleEditCategoryBrand,
};
