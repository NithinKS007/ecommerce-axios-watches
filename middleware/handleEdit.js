
const adminController = require('../controllers/adminController')

const handleEdit = (req,res,next) =>{
    
        if(req.query.categoryId){

            return adminController.editCategory(req,res,next)

        } else if (req.query.brandId){

            console.log(`brandId from the middleware`,req.query.brandId)
            
            return adminController.editBrand(req,res,next)
        }

}


module.exports = {

    handleEdit
}