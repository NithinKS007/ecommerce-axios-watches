const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const walletSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: 'User',
        required: true,
        unique: true 
    },
    balance: {
        type: Number,
        required: true,
        default: 0 
    },
    transactions: [{ 
        type: ObjectId,
        ref: 'transaction' 
    }]
}, { timestamps: true });


const wallet = mongoose.model('wallet', walletSchema);


module.exports = wallet;




