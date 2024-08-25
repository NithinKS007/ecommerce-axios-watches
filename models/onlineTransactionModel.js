const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const transactionSchema = new mongoose.Schema({
  userId: {
    type: ObjectId,
    ref: 'user',
    required: true
  },
  orderId:{
    type:ObjectId,
    ref:'order',
    required:true
  },
  paymentProvider:{
    type: String,
    required:false
  },
  onlinePaymentOrderId:{
    type:String,
    required:false
  },
  amount:{
    type:Number,
    required:true
  },
  currency:{
    type: String,
    required: true,
    default: 'INR'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
}
}, { timestamps: true });

const transaction = mongoose.model('transaction', transactionSchema);

module.exports = transaction ;

