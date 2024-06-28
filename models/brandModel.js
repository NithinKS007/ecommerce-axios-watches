const mongoose = require('mongoose')

const brandSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    isActive:{
        type:Boolean,
        default:true
    }
      
})

const brands = mongoose.model('brand',brandSchema)

module.exports = brands
