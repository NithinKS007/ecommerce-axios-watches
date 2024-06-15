const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true
    }, 
    lname: {
        type: String,
        required: true
    },
    dob :{
        type : Date,
        required :true
    },
    image: {
        type: String,
        required:true
  
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },
   
})

const admin = mongoose.model('user',adminSchema)

module.exports = admin