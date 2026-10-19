const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const Delivery = require('../models/Delivery');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const CouponRedemption = require('../models/CouponRedemption');
const FoodRequest = require('../models/FoodRequest');
const IssueReport = require('../models/IssueReport');
const { protect, donorOnly, volunteerOnly, operatorOnly } = require('../middleware/auth');

// Donors and volunteers can report an issue with one of their requests.
router.post('/reports', protect, async (req, res) => {
  try {
    const { foodRequestId, details } = req.body;
    if (typeof foodRequestId !== 'string' || !/^[a-f\d]{24}$/i.test(foodRequestId)) {
      return res.status(400).json({ success: false, message: 'Choose a valid food request' });
    }
    if (typeof details !== 'string' || details.trim().length < 5 || details.trim().length > 2000) {
      return res.status(400).json({ success: false, message: 'Describe the issue in 5 to 2000 characters' });
    }
    const filter = { _id: foodRequestId };
    if (req.user.role !== 'operator') {
      filter.$or = [{ donor: req.user._id }, { volunteer: req.user._id }];
    }
    const request = await FoodRequest.findOne(filter).select('_id');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found or you do not have access to it' });

    const report = await IssueReport.create({ reporter: req.user._id, foodRequest: request._id, details: details.trim() });
    res.status(201).json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Operator overview for the operational dashboard.
router.get('/operator/overview', protect, operatorOnly, async (req, res) => {
  try {
    const [users, deliveries, reports, couponClaims, counts] = await Promise.all([
      User.find()
        .select('name email phone role points totalDeliveries totalDonations createdAt')
        .sort({ createdAt: -1 }).limit(200),
      Delivery.find().populate('volunteer', 'name email').populate('donor', 'name email')
        .populate('foodRequest', 'title status').sort({ deliveredAt: -1 }).limit(200),
      IssueReport.find().populate('reporter', 'name email role').populate('foodRequest', 'title status')
        .sort({ createdAt: -1 }).limit(200),
      CouponRedemption.find().populate('volunteer', 'name email').sort({ redeemedAt: -1 }).limit(200),
      Promise.all([
        User.countDocuments({ role: 'donor' }),
        User.countDocuments({ role: 'volunteer' }),
        User.countDocuments({ role: 'operator' }),
        FoodRequest.countDocuments(),
        Delivery.countDocuments(),
        IssueReport.countDocuments({ status: 'open' }),
        CouponRedemption.countDocuments(),
      ]),
    ]);
    res.json({
      success: true,
      users,
      deliveries,
      reports,
      couponClaims,
      counts: {
        donors: counts[0], volunteers: counts[1], operators: counts[2], foodRequests: counts[3],
        deliveries: counts[4], openReports: counts[5], couponClaims: counts[6],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/operator/reports/:id/resolve', protect, operatorOnly, async (req, res) => {
  try {
    const report = await IssueReport.findByIdAndUpdate(req.params.id, {
      status: 'resolved',
      resolutionNote: typeof req.body.resolutionNote === 'string' ? req.body.resolutionNote.trim().slice(0, 1000) : '',
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
    }, { new: true }).populate('reporter', 'name email role').populate('foodRequest', 'title status');
    if (!report) return res.status(404).json({ success: false, message: 'Issue report not found' });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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
    const [coupons, redemptions, volunteer] = await Promise.all([
      Coupon.find({ active: true }).sort({ createdAt: -1 }).select('title description expiresAt usageLimit claimedCount'),
      CouponRedemption.find({ volunteer: req.user._id }).sort({ redeemedAt: -1 }),
      User.findById(req.user._id).select('points'),
    ]);
    res.json({ success: true, coupons, redemptions, points: volunteer.points || 0, pointsToUnlock: 10 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Operators manage the catalog. Operator accounts must be provisioned by an administrator.
router.post('/coupons', protect, operatorOnly, async (req, res) => {
  try {
    const { title, code, description = '', expiresAt = '', usageLimit = '' } = req.body;
    if (!title?.trim() || !code?.trim()) {
      return res.status(400).json({ success: false, message: 'Coupon title and code are required' });
    }
    const parsedExpiry = expiresAt
      ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(expiresAt) ? `${expiresAt}T23:59:59.999Z` : expiresAt)
      : null;
    if (expiresAt && Number.isNaN(parsedExpiry.getTime())) {
      return res.status(400).json({ success: false, message: 'Enter a valid expiry date' });
    }
    const parsedUsageLimit = usageLimit === '' || usageLimit == null ? null : Number(usageLimit);
    if (parsedUsageLimit !== null && (!Number.isInteger(parsedUsageLimit) || parsedUsageLimit < 1)) {
      return res.status(400).json({ success: false, message: 'Usage limit must be a whole number greater than zero' });
    }
    const coupon = await Coupon.create({
      title: title.trim(),
      code: code.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      expiresAt: parsedExpiry,
      usageLimit: parsedUsageLimit,
    });
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/coupon-catalog', protect, operatorOnly, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/coupons/:id/toggle', protect, operatorOnly, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    coupon.active = !coupon.active;
    await coupon.save();
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/coupons/:id/redeem', protect, volunteerOnly, async (req, res) => {
  let reservedCoupon = false;
  let deductedPoints = false;
  try {
    const now = new Date();
    const coupon = await Coupon.findOneAndUpdate({
      _id: req.params.id,
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      $expr: {
        $or: [
          { $eq: [{ $ifNull: ['$usageLimit', null] }, null] },
          { $lt: [{ $ifNull: ['$claimedCount', 0] }, '$usageLimit'] },
        ],
      },
    }, { $inc: { claimedCount: 1 } }, { new: true });
    if (!coupon) {
      const unavailable = await Coupon.findById(req.params.id);
      if (!unavailable || !unavailable.active) {
        return res.status(404).json({ success: false, message: 'Coupon is no longer available' });
      }
      if (unavailable.expiresAt && unavailable.expiresAt <= now) {
        return res.status(410).json({ success: false, message: 'This coupon has expired' });
      }
      if (unavailable.usageLimit != null && unavailable.claimedCount >= unavailable.usageLimit) {
        return res.status(410).json({ success: false, message: 'This coupon has been fully claimed' });
      }
      return res.status(404).json({ success: false, message: 'Coupon is no longer available' });
    }
    reservedCoupon = true;

    // Atomic balance deduction and coupon reservation prevent concurrent over-claims.
    const volunteer = await User.findOneAndUpdate(
      { _id: req.user._id, role: 'volunteer', points: { $gte: 10 } },
      { $inc: { points: -10, couponsEarned: 1 } },
      { new: true, select: 'points couponsEarned' }
    );
    if (!volunteer) {
      await Coupon.findByIdAndUpdate(coupon._id, { $inc: { claimedCount: -1 } });
      reservedCoupon = false;
      const current = await User.findById(req.user._id).select('points');
      return res.status(400).json({ success: false, message: `You need ${Math.max(0, 10 - (current?.points || 0))} more points to unlock a coupon` });
    }
    deductedPoints = true;

    const redemption = await CouponRedemption.create({
      volunteer: req.user._id,
      coupon: coupon._id,
      couponTitle: coupon.title,
      couponCode: coupon.code,
      pointsSpent: 10,
    });
    reservedCoupon = false;
    deductedPoints = false;
    res.json({ success: true, redemption, points: volunteer.points, couponsEarned: volunteer.couponsEarned });
  } catch (err) {
    if (deductedPoints) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { points: 10, couponsEarned: -1 } }).catch(() => {});
    }
    if (reservedCoupon) {
      await Coupon.findByIdAndUpdate(req.params.id, { $inc: { claimedCount: -1 } }).catch(() => {});
    }
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
