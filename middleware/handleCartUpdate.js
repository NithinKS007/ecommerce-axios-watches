const cartController = require("../controllers/cartController");

const handleCartUpdate = (req, res, next) => {
  if (req.body.productId && req.body.quantity) {
    return cartController.updateQuantityFromCart(req, res, next);
  } else if (req.body.selectedProductIds) {
    return cartController.updatedSelectedItems(req, res, next);
  } else {
    return res.status(400).json({ message: "Invalid request body" });
  }
};

module.exports = {
  handleCartUpdate,
};
