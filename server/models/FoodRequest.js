const mongoose = require('mongoose');

const foodRequestSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  title: { type: String, required: true },
  description: { type: String, default: '' },
  foodType: { type: String, enum: ['cooked', 'raw', 'packaged', 'other'], default: 'other' },
  quantity: { type: String, required: true },
  servings: { type: Number, default: 1 },
  expiresAt: { type: Date },

  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending',
  },

  // Pickup location (auto-captured from browser)
  pickupLocation: {
    type: { type: String, default: 'Point' },
    coordinates: [Number], // [lng, lat]
    address: { type: String, default: '' },
  },

  // Volunteer live location (updated via socket)
  volunteerLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },

  image: { type: String, default: '' },
  acceptedAt: { type: Date },
  deliveredAt: { type: Date },

}, { timestamps: true });

foodRequestSchema.index({ pickupLocation: '2dsphere' });

module.exports = mongoose.model('FoodRequest', foodRequestSchema);
