
const adminController = require('../controllers/adminController')

const handleCategoryBrandExists = (req,res,next) =>{
    
        if(req.query.encodedCName){

            console.log('Entered category name already exists, checking middleware.');

            return adminController.categoryExists(req,res,next)

        } 
        else if (req.query.encodedBName){

            console.log('Entered brand name already exists, checking middleware.');

            
            return adminController.brandExists(req,res,next)

        }

}


module.exports = {

    handleCategoryBrandExists
    
}