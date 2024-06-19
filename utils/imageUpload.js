const multer = require('multer')
const path = require('path')


const maxSize = 10*1000*1000

const storage = multer.diskStorage({
    
    destination:(req,file,cb) =>{

        cb(null,path.join(__dirname,"../public/productImages"))
    },
    filename: (req,file,cb) =>{

        const name = Date.now()+"-"+file.originalname

        cb(null,name)
    },
    // onFileUploadStart:(file,req,res) =>{

    //     if(req.files.file.length>maxSize){

    //         console.log(`file is more than 10 mb`)

    //         return false
    //     }
    // }
})


const upload = multer({storage:storage})


module.exports = upload