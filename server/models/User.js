const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['donor', 'volunteer', 'operator'], required: true },
  phone: { type: String, default: '' },
  avatar: { type: String, default: '' },
  address: { type: String, default: '' },

  // Location (auto-captured)
  // Location (optional; set when valid GPS coordinates are available)
location: {
  type: {
    type: String,
    enum: ['Point'],
  },
  coordinates: {
    type: [Number],
    validate: {
      validator: function (coordinates) {
        return (
          coordinates.length === 2 &&
          coordinates.every(Number.isFinite) &&
          coordinates[0] >= -180 &&
          coordinates[0] <= 180 &&
          coordinates[1] >= -90 &&
          coordinates[1] <= 90
        );
      },
      message: 'Location must contain valid [longitude, latitude] coordinates',
    },
  },
},

  // Donor-specific
  totalDonations: { type: Number, default: 0 },
  certificates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' }],

  // Volunteer-specific
  totalDeliveries: { type: Number, default: 0 },
  couponsEarned: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
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
