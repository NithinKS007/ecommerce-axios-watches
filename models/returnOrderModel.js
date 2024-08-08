const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const returnItemSchema = new mongoose.Schema({
 
    product:{
        type:ObjectId,
        required:true,
        ref:"product"
    },
    returnProductStatus: {
        type: String,
        enum: ["initiated","approved","rejected"],
        default: "initiated"
      },
    productRefundAmount:{
        type:Number,
        min: 0,
    },
    productReturnDate:{
        type:Date,
        default: Date.now,
        required:true
    },
    productReturnReason:{
        type:String,
    },
   
}, { timestamps: true });

const returnOrderSchema = new mongoose.Schema({

    items:[returnItemSchema],
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
    orderRefundAmount:{
        type:Number,
        min: 0 
    },
    returnOrderStatus:{
        type:String,
        enum:["initiated","approved","rejected"],
        default:"initiated",
        required:true
    },
    returnOrderDate:{
        type:Date,
        default: Date.now,
        required:true
    },
    returnOrderReason:{
        type:String,

    }
}, { timestamps: true })

const returnOrder = mongoose.model('returnOrder', returnOrderSchema);

module.exports = returnOrder
