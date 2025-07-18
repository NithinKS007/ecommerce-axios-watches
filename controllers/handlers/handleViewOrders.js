const statusCodes = require("../../utils/statusCodes");
const userOrderController = require("../userOrderController");

const handleViewOrders = (req, res) => {
  switch (req.query.view) {
    case "orders":
      return userOrderController.loadOrders(req, res);
    case "details":
      return userOrderController.loadOrderDetails(req, res);
    case "confirmation":
      return userOrderController.loadPlaceOrder(req, res);
    default:
      return res.status(statusCodes.BAD_REQUEST).send("Invalid view parameter");
  }
};

module.exports = {
  handleViewOrders,
};
