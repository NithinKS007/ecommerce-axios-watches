const statusCodes = require("../../utils/statusCodes");
const offerController = require("../offerController");

const handleViewCategoryOffer = (req, res) => {
  switch (req.query.view) {
    case "offers":
      return offerController.loadCategoryOffer(req, res);
    case "addoffers":
      return offerController.loadAddCategoryOffer(req, res);
    case "editoffers":
      return offerController.loadEditCategoryOffer(req, res);
    default:
      return res.status(statusCodes.BAD_REQUEST).send("Invalid view parameter");
  }
};

module.exports = {
  handleViewCategoryOffer,
};
