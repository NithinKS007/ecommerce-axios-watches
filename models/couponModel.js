const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const couponSchema = new mongoose.Schema({
 
    couponName:{
        type:String,
        required:true
    },
    couponDescription: {
        type: String,
        required: false
    },
    
    couponCode:{
        type:String,
        required:true,
        unique:true
    },
    couponDiscount:{
        type:Number,
        required:true
    },
    couponStatus:{
        type:Boolean,
        required:true
    },
    maxAmount:{
        type:Number,
        required:true
    },
    minAmount:{
        type:Number,
        required:true
    },
    userBy:[{
        type:ObjectId,
        ref:"user"
    }]
}, { timestamps: true });



const coupons = mongoose.model('coupon', couponSchema);

module.exports = coupons
