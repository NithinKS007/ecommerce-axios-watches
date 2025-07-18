const addressController = require("../addressController");

const handleViewAddress = (req, res) => {
  switch (req.query.view) {
    case "addnew":
      return addressController.loadAddAddress(req, res);
    default:
      return addressController.loadAddress(req, res);
  }
};

module.exports = {
  handleViewAddress,
};
