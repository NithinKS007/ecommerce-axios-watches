const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
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
  categoryOffer: {
    offerName: String,
    discountPercentage: Number,
    startDate: Date,
    expiryDate: Date,
    isActive: {
      type: Boolean,
    }
  },
  hasOffer: { 
    type: Boolean,
    default: false
}
}, { timestamps: true });  


const categories = mongoose.model('category', categorySchema);

module.exports = categories
