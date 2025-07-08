const adminOrderController = require("../adminOrderController");

const handleViewOrdersAdmin = (req, res) => {
   switch (req.query.view) {
    case "orders":
      return adminOrderController.loadOrderList(req, res);
    case "details":
      return adminOrderController.loadOrderDetailsPage(req, res);
    case "return":
      return adminOrderController.loadReturnedOrder(req, res);
    default:
      return res.status(400).send("Invalid view parameter");
  }
};

module.exports = {
  handleViewOrdersAdmin,
};
