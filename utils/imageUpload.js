const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); 

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/productImages"));
    },
    filename: (req, file, cb) => {
       
        const uniqueId = uuidv4();
        
        const fileExtension = path.extname(file.originalname);
       
        const filename =`${Date.now()}-${uniqueId}${fileExtension}`
         
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

module.exports = { upload };