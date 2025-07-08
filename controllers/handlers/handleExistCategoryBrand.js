const categoryBrandController = require("../categoryBrandController");

const handleCategoryBrandExists = (req, res) => {
  if (req.query.encodedCName) {
    return categoryBrandController.categoryExists(req, res);
  } else if (req.query.encodedBName) {
    return categoryBrandController.brandExists(req, res);
  }
};

module.exports = {
  handleCategoryBrandExists,
};
