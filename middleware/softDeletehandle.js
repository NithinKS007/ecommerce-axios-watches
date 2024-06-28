
const adminController = require('../controllers/adminController')


const handleSoftDelete = (req, res, next) => {

    if (req.query.categoryId) {

        return adminController.softDeleteCategory(req, res, next)

    } else if (req.query.brandId) {

        return adminController.softDeleteBrand(req, res, next)

    } 
}

module.exports = {
    handleSoftDelete
};
