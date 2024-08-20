const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId

const offerSchema = new Schema({
    offerName: {
        type: String,
        required: true
    },
    offerDiscountPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    offerDiscountAmount:{

        type:Number,
        required:true
    },
    offerStartDate: {
        type: Date,
        required: true
    },
    offerExpiryDate: {
        type: Date,
        required: true
    },
    offerStatus: {
        type: Boolean,
        required:true
    }
},{ timestamps: true })

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
    },

    productSalesPriceAfterOfferDiscount:{
       type:Number,
       default:0
    },
    productOffer: offerSchema 
      
},{ timestamps: true });

const products = mongoose.model('product',productSchema);

module.exports = products;
