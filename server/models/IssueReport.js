const mongoose = require('mongoose');

const issueReportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  foodRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodRequest', required: true },
  details: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  resolutionNote: { type: String, default: '', trim: true, maxlength: 1000 },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('IssueReport', issueReportSchema);
