const productController = require("../productController");

const handleViewProductsAdmin = (req, res) => {
  switch (req.query.view) {
    case "list":
      return productController.loadProducts(req, res);
    case "add":
      return productController.loadaddProduct(req, res);
    case "edit":
      return productController.loadEditProduct(req, res);
    case "exist":
      return productController.ProductExists(req, res);
    default:
      return res.status(400).send("Invalid view parameter");
  }
};

module.exports = {
  handleViewProductsAdmin,
};
