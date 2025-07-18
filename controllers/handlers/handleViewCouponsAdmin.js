const statusCodes = require("../../utils/statusCodes");
const couponController = require("../couponController");

const handleViewCoupon = (req, res) => {
  switch (req.query.view) {
    case "add":
      return couponController.loadAddCoupon(req, res);
    case "list":
      return couponController.loadCoupon(req, res);
    case "edit":
      return couponController.loadEditCoupon(req, res);
    default:
      return res.status(statusCodes.BAD_REQUEST).send("Invalid view parameter");
  }
};

module.exports = {
  handleViewCoupon,
};
