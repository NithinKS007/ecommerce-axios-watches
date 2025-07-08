const couponController = require("../couponController");

const handleViewCoupon = (req, res) => {
  switch (req.query.view) {
    case "add":
      return couponController.loadAddCoupon(req, res);
    case "list":
      return couponController.loadCoupon(req, res);
    default:
      return res.status(400).send("Invalid view parameter");
  }
};

module.exports = {
  handleViewCoupon,
};
