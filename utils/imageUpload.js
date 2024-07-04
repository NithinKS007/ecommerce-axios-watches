const multer = require('multer')
const path = require('path')


// const maxSize = 10*1000*1000

const storage = multer.diskStorage({
    
    destination:(req,file,cb) =>{

        cb(null,path.join(__dirname,"../public/productImages"))
    },
    filename: (req,file,cb) =>{

        const name = Date.now()+"-"+file.originalname

        cb(null,name)
    },
    
})



const upload = multer({storage:storage})

module.exports ={

    upload 

} 
