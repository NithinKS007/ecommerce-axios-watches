const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId

const userSchema = new mongoose.Schema({

    fname: {
        type: String,
        required:true
    }, 
    lname: {
        type: String,
        required:true
    },
    dob :{
        type : Date
    },
    image: {

        type: String
    },
    email: {
        type: String,
        required:true
    },
    phone: {
        type: Number,
        
    },
    addressId:[{

       type:ObjectId,
       ref:"address",
       

    }],
    password: {
        type: String,
        
    },
    googleId:{
        type:String,
    },
    isBlocked:{
        type:Boolean,
        default:false
    }
    },{timestamps:true});

const users = mongoose.model('user',userSchema)

module.exports = users