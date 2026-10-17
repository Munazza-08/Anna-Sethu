const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['donor', 'volunteer'], required: true },
  phone: { type: String, default: '' },
  avatar: { type: String, default: '' },
  address: { type: String, default: '' },

  // Location (auto-captured)
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number], // [lng, lat]
  },

  // Donor-specific
  totalDonations: { type: Number, default: 0 },
  certificates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' }],

  // Volunteer-specific
  totalDeliveries: { type: Number, default: 0 },
  couponsEarned: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },

}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
