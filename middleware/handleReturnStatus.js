
const adminOrderController = require('../controllers/adminOrderController')

const handleReturnStatus = (req,res,next) =>{
    
        if(req.body.status==="approved"){

            return adminOrderController.approveReturn(req,res,next)

        } 
        else if (req.body.status==="rejected"){

            return adminOrderController.rejectReturn(req,res,next)
        }

}


module.exports = {

    handleReturnStatus
}