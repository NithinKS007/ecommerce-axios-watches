const statusCodes = require("../../utils/statusCodes");
const adminOrderController = require("../adminOrderController");

const handleReturnStatus = (req, res) => {
 switch (req.body.status) {
    case "approved":
      return adminOrderController.approveReturn(req, res);
    case "rejected":
      return adminOrderController.rejectReturn(req, res);
    default:
      return res.status(statusCodes.BAD_REQUEST).send("Invalid status value");
  }
};

module.exports = {
  handleReturnStatus,
};
