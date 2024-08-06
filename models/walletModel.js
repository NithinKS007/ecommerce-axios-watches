const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const walletTransactions = new mongoose.Schema({

    orderId: {
        type: ObjectId,
        ref: 'order', 
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    walletTransactionStatus:{
        type:String,
        enum: ["refunded","pending", "paid"],
         default: "pending"
    }
}, { timestamps: true });

const walletSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: 'user',
        required: true,
        unique: true 
    },
    balance: {
        type: Number,
        required: true,
        default: 0 
    },

   transactions:[walletTransactions]

}, { timestamps: true });


const wallet = mongoose.model('wallet', walletSchema);


module.exports = wallet;




