// const sharp = require('sharp')
// const fs = require('fs')


// //image resizing using sharp

// const cropImg = async (req,res,next) =>{
   
//     console.log(`resizing function is working but check if its proper`);
//     try {

//         const result = []

//         for(const file of req.files){
            
//             const { originalname, path:originalPath } = file
             
//             console.log(originalname);

//             console.log(originalPath)

//             const width = 280
//             const height = 280
 
//             const readMe = fs.readFileSync(originalPath)
             
//             console.log('this is readme',readMe)

//             const croppedImg = await sharp(readMe)

//             .resize(width,height)
//             .toBuffer()
            
//             fs.writeFileSync(originalPath,croppedImg)
        
//             result.push({originalname:originalname,originalPath:originalPath})

//             console.log(result);
          
//             console.log(`file resized successfully`);
//             next()
//         }
        
//     } catch (error) {

//         console.log(`error while cropping the image: ` ,error.message);
        
//     }
// }


// module.exports = { cropImg }