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
      break;
  }
};

module.exports = {
  handleViewCategoryOffer,
};
