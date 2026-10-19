const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  expiresAt: { type: Date, default: null },
  usageLimit: { type: Number, default: null, min: 1 },
  claimedCount: { type: Number, default: 0, min: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
