const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'Donor Appreciation Certificate' },
  milestone: { type: String, default: '' }, // e.g. "10 donations"
  issuedAt: { type: Date, default: Date.now },
  certificateId: { type: String, unique: true },
}, { timestamps: true });

// Auto-generate certificate ID
certificateSchema.pre('save', function (next) {
  if (!this.certificateId) {
    this.certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Certificate', certificateSchema);
