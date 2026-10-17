const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  foodRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodRequest', required: true },

  proofImage: { type: String, default: '' },
  notes: { type: String, default: '' },
  deliveredAt: { type: Date, default: Date.now },

  // Coupon awarded for this delivery
  couponAwarded: { type: Boolean, default: false },
  couponCode: { type: String, default: '' },

}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
