
const categoryBrandController = require('../controllers/categoryBrandController')

const handleEditCategoryBrand = (req,res,next) =>{
    
        if(req.body.categoryId){

            return categoryBrandController.editCategory(req,res,next)

        } 
        else if (req.body.brandId){

            
            return categoryBrandController.editBrand(req,res,next)
            
        }

}


module.exports = {

    handleEditCategoryBrand
}