const categoryBrandController = require("../controllers/categoryBrandController");

const handleCategoryBrandExists = (req, res, next) => {
  if (req.query.encodedCName) {
    return categoryBrandController.categoryExists(req, res, next);
  } else if (req.query.encodedBName) {
    return categoryBrandController.brandExists(req, res, next);
  }
};

module.exports = {
  handleCategoryBrandExists,
};
