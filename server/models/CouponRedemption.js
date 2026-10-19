const mongoose = require('mongoose');

const couponRedemptionSchema = new mongoose.Schema({
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
  couponTitle: { type: String, required: true },
  couponCode: { type: String, required: true },
  pointsSpent: { type: Number, default: 10 },
  redeemedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('CouponRedemption', couponRedemptionSchema);
