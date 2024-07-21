const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const orderItemSchema = new mongoose.Schema({
  product: {
    type: ObjectId,
    ref: 'product',
    required: true
  },  
  productName: { 
    type: String,
    required: true
  },
  brand: { 
    type: ObjectId,
    ref: 'brand',
    required: true
  },
  brandName: { 
    type: String,
    required: true
  },
  category: { 
    type: ObjectId,
    ref: 'category',
    required: true
  },
  categoryName: {
    type: String,
    required: true
  },
  categoryDescription:{
    type:String,
    required:true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  regularPrice: { 
    type: Number,
    required: true
  },
  description:{

    type:String,
    required:true
  },
  targetGroup:{

    type:String,
    required:true
  },
  displayType:{

    type:String,
    required:true
  },
  strapColor:{

    type:String,
    required:true
  },
  strapMaterial:{

    type:String,
    required:true
  },
  dialShape:{

    type:String,
    required:true
  },
  images: {
    type : Array,
    required:true
  },

  subTotal: { 
    type: Number, 
    required: true 
  }

}, { timestamps: true });

const orderSchema = new mongoose.Schema({

  items: [orderItemSchema],

  user: {
    type: ObjectId,
    ref: 'user',
    required: true
  },
  totalItems : {
    type : Number,
    required : true,
    default : 1
   },
   totalAmount : {
    type : Number,
    required : true,
    default : 0
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  orderStatus: {
    type: String,
    required: true,
    enum: ['pending', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: true
  },
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: Number, required: true },
    pincode: { type: Number, required: true },
    locality: { type: String, required: true },
    address: { type: String, required: true },
    cityDistTown: { type: String, required: true },
    state: { type: String, required: true },
    landMark: { type: String },
    altPhone: { type: Number },
    email: { type: String, required: true },
    addressType: { type: String, required: true }
  },
}, { timestamps: true });

const Order = mongoose.model('order', orderSchema);

module.exports = Order;
