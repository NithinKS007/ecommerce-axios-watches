const statusCodes = require("../../utils/statusCodes");
const offerController = require("../offerController");

const handleViewProductOffer = (req, res) => {
  switch (req.query.view) {
    case "offers":
      return offerController.loadProductOffer(req, res);
    case "addoffers":
      return offerController.loadAddProductOffer(req, res);
    case "editoffers":
      return offerController.loadEditProductOffer(req, res);
    default:
      return res.status(statusCodes.BAD_REQUEST).send("Invalid view parameter");
  }
};

module.exports = {
  handleViewProductOffer,
};
