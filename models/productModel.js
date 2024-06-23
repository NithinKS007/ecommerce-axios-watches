const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId

const productSchema = new mongoose.Schema({
    category: {
        type:ObjectId ,
        ref:"category",
        required: true
    },
    brand: {
        type:ObjectId,
        ref:"brand",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    dialshape: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    regularPrice: {
        type: Number,
        required: true
    },
    salesPrice: {   
        type: Number,
        required: true
    },
    images: {
        type: Array,
    
    },
    strapmaterial: {
        type: String,
        required:true
    },
    color : {
        type: String,
        required:true
        
    },
    stock: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    targetGroup:{
        type:String,
        required:true
    }
      
},{ timestamps: true });

const products = mongoose.model('product',productSchema);

module.exports = products;
