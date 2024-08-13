const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const returnProductSchema = new mongoose.Schema({
    orderId:{
        type:ObjectId,
        required:true,
        ref:"order"
    },
    userId: {
        type: ObjectId,
        required: true,
        ref:"user"
    },
    productId:{
        type:ObjectId,
        required:true,
        ref:"product"
    },
    returnProductStatus: {
        type: String,
        enum: ["initiated","approved","rejected"],
        default: "initiated",
        required:true
      },
    productRefundAmount:{
        type:Number,
        min: 0,
        default:0,
        required:true
    },
    productReturnDate:{
        type:Date,
        default: Date.now,
        required:true
    },
    productReturnReason:{
        type:String,
        required:true
    },
   
}, { timestamps: true });


const returnProduct = mongoose.model('returnProduct', returnProductSchema);

module.exports = returnProduct
