const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const Delivery = require('../models/Delivery');
const User = require('../models/User');
const { protect, donorOnly, volunteerOnly } = require('../middleware/auth');

// ── GET donor certificates ────────────────────────────────────────
// GET /api/users/certificates
router.get('/certificates', protect, donorOnly, async (req, res) => {
  try {
    const certs = await Certificate.find({ donor: req.user._id }).sort({ issuedAt: -1 });
    res.json({ success: true, certificates: certs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET volunteer delivery history ────────────────────────────────
// GET /api/users/deliveries
router.get('/deliveries', protect, volunteerOnly, async (req, res) => {
  try {
    const deliveries = await Delivery.find({ volunteer: req.user._id })
      .populate('foodRequest', 'title pickupLocation status')
      .populate('donor', 'name avatar')
      .sort({ deliveredAt: -1 });
    res.json({ success: true, deliveries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET volunteer coupons ─────────────────────────────────────────
// GET /api/users/coupons
router.get('/coupons', protect, volunteerOnly, async (req, res) => {
  try {
    const deliveries = await Delivery.find({ volunteer: req.user._id, couponAwarded: true })
      .select('couponCode deliveredAt')
      .sort({ deliveredAt: -1 });
    res.json({ success: true, coupons: deliveries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET user stats ────────────────────────────────────────────────
// GET /api/users/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
