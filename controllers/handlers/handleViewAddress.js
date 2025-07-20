const addressController = require("../addressController");

const handleViewAddress = (req, res) => {
  switch (req.query.view) {
    case "add":
      return addressController.loadAddAddress(req, res);
    case "edit":
      return addressController.loadEditAddress(req, res);
    default:
      return addressController.loadAddress(req, res);
  }
};

module.exports = {
  handleViewAddress,
};
