const statusCodes = require("../../utils/statusCodes");
const categoryBrandController = require("../categoryBrandController");

const handleEditCategoryBrand = (req, res) => {
  if (req.body.categoryId) {
    return categoryBrandController.editCategory(req, res);
  } else if (req.body.brandId) {
    return categoryBrandController.editBrand(req, res);
  } else {
    return res.status(statusCodes.BAD_REQUEST).send("Invalid Query Params");
  }
};

module.exports = {
  handleEditCategoryBrand,
};
