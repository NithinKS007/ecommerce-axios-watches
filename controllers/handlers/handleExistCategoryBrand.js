const categoryBrandController = require("../categoryBrandController");

const handleCategoryBrandExists = (req, res) => {
  if (req.query.encodedCName) {
    return categoryBrandController.categoryExists(req, res);
  } else if (req.query.encodedBName) {
    return categoryBrandController.brandExists(req, res);
  } else {
     return res.status(400).send("Invalid Query Params");
  }
};

module.exports = {
  handleCategoryBrandExists,
};
