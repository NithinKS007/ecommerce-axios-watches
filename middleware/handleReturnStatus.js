
const adminController = require('../controllers/adminController')

const handleReturnStatus = (req,res,next) =>{
    
        if(req.body.status==="approved"){

            console.log(`entering in approved`);
            

            return adminController.approveReturn(req,res,next)

        } 
        else if (req.body.status==="rejected"){

            console.log(`entering in rejected`);

            return adminController.rejectReturn(req,res,next)
        }

}


module.exports = {

    handleReturnStatus
}