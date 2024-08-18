const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId

const addressSchema = new mongoose.Schema({

     name:{
       type: String,
       required:true
     },
     userId:{

        type:ObjectId ,
        ref:"user",
        required: true

     },
     phone:{

        type:Number,
        required:true
     },
     pincode:{

        type:Number,
        required:true
     },
   
     locality:{

        type:String,
        required:true
     },
     address:{

        type:String,
        required:true

     },
     cityDistTown:{

        type:String,
        required:true
    },
    state:{

        type:String,
        required:true
    },
    landMark:{

        type:String

    },
    altPhone:{

        type:Number
    },
     email:{

        type:String,
        required:true

     },
     addressType:{

        type:String,
        required:true
     }
      
})

const address = mongoose.model('address',addressSchema)

module.exports = address
