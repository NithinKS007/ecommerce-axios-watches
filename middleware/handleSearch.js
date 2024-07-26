
const userController = require('../controllers/userController')


const handleSearch = (req, res, next) => {

    if (req.query.searchProduct) {

        return userController.searchProducts(req, res, next)

    } else if (req.query.categories || req.query.brands || req.query.sortby || req.query.targetGroup) {

        return userController.advancedSearch(req, res, next)

    } else {
        
        return res.status(400).json({ message: "No search parameters provided" });
    }
}

module.exports = {

    handleSearch

};
