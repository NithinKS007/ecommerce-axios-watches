const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId

const addressSchema = new mongoose.Schema({

     name:{
       type: String,
     },
     userId:{

        type:ObjectId ,
        ref:"user",
        required: true

     },
     phone:{

        type:Number
     },
     pincode:{

        type:Number
     },
   
     locality:{

        type:String
     },
     address:{

        type:String

     },
     cityDistTown:{

        type:String 
    },
    state:{

        type:String
    },
    landMark:{

        type:String

    },
    altPhone:{

        type:Number
    },
     email:{

        type:String,

     },
     addressType:{

        type:String
     }
      
})

const address = mongoose.model('address',addressSchema)

module.exports = address
