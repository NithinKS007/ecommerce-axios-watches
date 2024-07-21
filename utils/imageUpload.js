const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Import UUID

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/productImages"));
    },
    filename: (req, file, cb) => {
        // Generate a unique UUID
        const uniqueId = uuidv4();
        // Get the file extension
        const fileExtension = path.extname(file.originalname);
        // Create the filename with timestamp, UUID, and original extension
        const filename =`${Date.now()}-${uniqueId}${fileExtension}` 
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

module.exports = { upload };