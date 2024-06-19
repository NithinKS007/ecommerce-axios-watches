const mongoose = require('mongoose')

const brandSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    }
      
})

const brands = mongoose.model('brand',brandSchema)

module.exports = brands
