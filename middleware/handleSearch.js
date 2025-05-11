const homePageController = require("../controllers/homePageController");

const handleSearch = (req, res, next) => {
  if (req.query.searchProduct) {
    return homePageController.searchProducts(req, res, next);
  } else if (
    req.query.categories ||
    req.query.brands ||
    req.query.sortby ||
    req.query.targetGroup
  ) {
    return homePageController.advancedSearch(req, res, next);
  }

  const currentUser = req.currentUser;

  if (currentUser) {
    return res.redirect("/home");
  } else {
    return res.redirect("/");
  }
};

module.exports = {
  handleSearch,
};
