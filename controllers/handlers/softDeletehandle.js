const categoryBrandController = require("../categoryBrandController");

const handleSoftDelete = (req, res) => {
  if (req.query.categoryId) {
    return categoryBrandController.softDeleteCategory(req, res);
  } else if (req.query.brandId) {
    return categoryBrandController.softDeleteBrand(req, res);
  } else {
    return res.status(400).send("Invalid Query Params");
  }
};

module.exports = {
  handleSoftDelete,
};
