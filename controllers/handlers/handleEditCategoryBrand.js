const categoryBrandController = require("../categoryBrandController");

const handleEditCategoryBrand = (req, res) => {
  if (req.body.categoryId) {
    return categoryBrandController.editCategory(req, res);
  } else if (req.body.brandId) {
    return categoryBrandController.editBrand(req, res);
  } else {
    return res.status(400).send("Invalid Query Params");
  }
};

module.exports = {
  handleEditCategoryBrand,
};
