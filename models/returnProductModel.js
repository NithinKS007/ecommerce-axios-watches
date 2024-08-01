const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const returnProductSchema = new mongoose.Schema({
 
    productId:{
        type:ObjectId,
        required:true,
        ref:"product"
    },
    userId: {
        type: ObjectId,
        required: true,
        ref:"user"
    },
    
    orderId:{
        type:ObjectId,
        required:true,
        ref:"order"
    },
    refundAmount:{
        type:Number,
        required:true
    },
    returnDate:{
        type:Date,
        required:true
    },
    returnReason:{
        type:String,
        required:true
    },
    returnStatus:{
        type:String,
        enum:["initiated","approved","rejected"],
        default:"initiated"
    }
}, { timestamps: true });



const returnProduct = mongoose.model('returnProduct', returnProductSchema);

module.exports = returnProduct
