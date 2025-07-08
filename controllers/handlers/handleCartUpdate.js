const cartController = require("../cartController");

const handleCartUpdate = (req, res) => {
  if (req.body.productId && req.body.quantity) {
    return cartController.updateQuantityFromCart(req, res);
  } else if (req.body.selectedProductIds) {
    return cartController.updatedSelectedItems(req, res);
  } else {
    return res.status(400).json({ message: "Invalid request body" });
  }
};

module.exports = {
  handleCartUpdate,
};
