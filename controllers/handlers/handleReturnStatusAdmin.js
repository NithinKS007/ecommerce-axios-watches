const adminOrderController = require("../adminOrderController");

const handleReturnStatus = (req, res) => {
 switch (req.body.status) {
    case "approved":
      return adminOrderController.approveReturn(req, res);
    case "rejected":
      return adminOrderController.rejectReturn(req, res);
    default:
      return res.status(400).send("Invalid status value");
  }
};

module.exports = {
  handleReturnStatus,
};
