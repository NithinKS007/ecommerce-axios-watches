
const categoryBrandController = require('../controllers/categoryBrandController')


const handleSoftDelete = (req, res, next) => {

    if (req.query.categoryId) {

        return categoryBrandController.softDeleteCategory(req, res, next)

    } else if (req.query.brandId) {

        return categoryBrandController.softDeleteBrand(req, res, next)

    } 
}

module.exports = {
    handleSoftDelete
};
