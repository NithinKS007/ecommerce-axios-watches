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
    dialShape: {
        type: String,
        required: true
    },
    displayType: {
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
        required:true
    
    },
    strapMaterial: {
        type: String,
        required:true
    },
    strapColor : {
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
    isBlocked: {
        type: Boolean,
        default: false
    },
    targetGroup:{
        type:String,
        required:true
    }
      
},{ timestamps: true });

const products = mongoose.model('product',productSchema);

module.exports = products;
