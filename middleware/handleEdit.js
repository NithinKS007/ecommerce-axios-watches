
const adminController = require('../controllers/adminController')

const handleEdit = (req,res,next) =>{
    
        if(req.body.categoryId){

            return adminController.editCategory(req,res,next)

        } 
        else if (req.body.brandId){

            
            return adminController.editBrand(req,res,next)
        }

}


module.exports = {

    handleEdit
}