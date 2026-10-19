const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FoodRequest = require('../models/FoodRequest');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const Delivery = require('../models/Delivery');
const { protect, donorOnly, volunteerOnly } = require('../middleware/auth');

// Multer for food request image uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(null, `food-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── CREATE food request (Donor only) ─────────────────────────────
// POST /api/food-requests
router.post('/', protect, donorOnly, upload.single('image'), async (req, res) => {
  try {
    const { title, description, foodType, quantity, servings, expiresAt, lat, lng, address } = req.body;

    if (!title || !quantity || !lat || !lng) {
      return res.status(400).json({ success: false, message: 'title, quantity, lat and lng are required' });
    }

    const foodRequest = await FoodRequest.create({
      donor: req.user._id,
      title,
      description,
      foodType,
      quantity,
      servings: servings || 1,
      expiresAt: expiresAt || null,
      pickupLocation: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
        address: address || '',
      },
      image: req.file ? `/uploads/${req.file.filename}` : '',
    });

    // Increment donor's total donations
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalDonations: 1 } });

    // Check milestones for certificates
    const donor = await User.findById(req.user._id);
    const milestones = [1, 5, 10, 25, 50, 100];
    if (milestones.includes(donor.totalDonations)) {
      const cert = await Certificate.create({
        donor: req.user._id,
        milestone: `${donor.totalDonations} donation${donor.totalDonations > 1 ? 's' : ''}`,
        title: `${donor.totalDonations} Donations Milestone`,
      });
      await User.findByIdAndUpdate(req.user._id, { $push: { certificates: cert._id } });
    }

    const populated = await FoodRequest.findById(foodRequest._id).populate('donor', 'name email phone');
    res.status(201).json({ success: true, foodRequest: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET nearby food requests (Volunteer only) ────────────────────
// GET /api/food-requests/nearby?lat=&lng=&radius=10000
router.get('/nearby', protect, volunteerOnly, async (req, res) => {
  try {
    const { lat, lng, radius = 10000 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng required' });
    }

    const requests = await FoodRequest.find({
      status: 'pending',
      pickupLocation: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      },
    }).populate('donor', 'name phone avatar').limit(50);

    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET donor's own requests ─────────────────────────────────────
// GET /api/food-requests/mine
router.get('/mine', protect, donorOnly, async (req, res) => {
  try {
    const requests = await FoodRequest.find({ donor: req.user._id })
      .populate('volunteer', 'name phone avatar')
      .sort({ createdAt: -1 });
    const deliveries = await Delivery.find({
      donor: req.user._id,
      foodRequest: { $in: requests.map(request => request._id) },
    }).select('foodRequest proofImage');
    const proofImages = new Map(deliveries.map(delivery => [String(delivery.foodRequest), delivery.proofImage]));
    const requestsWithProof = requests.map(request => ({
      ...request.toObject(),
      proofImage: proofImages.get(String(request._id)) || '',
    }));
    res.json({ success: true, requests: requestsWithProof });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET volunteer's accepted requests ────────────────────────────
// GET /api/food-requests/my-deliveries
router.get('/my-deliveries', protect, volunteerOnly, async (req, res) => {
  try {
    const requests = await FoodRequest.find({ volunteer: req.user._id })
      .populate('donor', 'name phone avatar address')
      .sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ACCEPT a food request (Volunteer only) ───────────────────────
// PATCH /api/food-requests/:id/accept
router.patch('/:id/accept', protect, volunteerOnly, async (req, res) => {
  try {
    const foodRequest = await FoodRequest.findById(req.params.id);
    if (!foodRequest) return res.status(404).json({ success: false, message: 'Request not found' });
    if (foodRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already accepted or closed' });
    }

    foodRequest.volunteer = req.user._id;
    foodRequest.status = 'accepted';
    foodRequest.acceptedAt = new Date();
    await foodRequest.save();

    const populated = await FoodRequest.findById(foodRequest._id)
      .populate('donor', 'name phone avatar')
      .populate('volunteer', 'name phone avatar');

    // Emit socket event for real-time update to donor
    const io = req.app.get('io');
    if (io) {
      io.to(`donor-${foodRequest.donor}`).emit('request-accepted', { foodRequest: populated });
    }

    res.json({ success: true, foodRequest: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── MARK IN TRANSIT (Volunteer) ──────────────────────────────────
// PATCH /api/food-requests/:id/transit
router.patch('/:id/transit', protect, volunteerOnly, async (req, res) => {
  try {
    const foodRequest = await FoodRequest.findOneAndUpdate(
      { _id: req.params.id, volunteer: req.user._id },
      { status: 'in_transit' },
      { new: true }
    ).populate('donor', 'name phone').populate('volunteer', 'name phone');

    if (!foodRequest) return res.status(404).json({ success: false, message: 'Not found' });

    const io = req.app.get('io');
    if (io) io.to(`donor-${foodRequest.donor._id}`).emit('status-update', { status: 'in_transit', foodRequest });

    res.json({ success: true, foodRequest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── COMPLETE delivery (Volunteer) ─────────────────────────────────
// PATCH /api/food-requests/:id/complete
router.patch('/:id/complete', protect, volunteerOnly, upload.single('proof'), async (req, res) => {
  try {
    const foodRequest = await FoodRequest.findOne({ _id: req.params.id, volunteer: req.user._id });
    if (!foodRequest) return res.status(404).json({ success: false, message: 'Not found' });

    foodRequest.status = 'delivered';
    foodRequest.deliveredAt = new Date();
    await foodRequest.save();

    // Create delivery record
    const delivery = await Delivery.create({
      volunteer: req.user._id,
      donor: foodRequest.donor,
      foodRequest: foodRequest._id,
      proofImage: req.file ? `/uploads/${req.file.filename}` : '',
      notes: req.body.notes || '',
      couponAwarded: false,
    });

    // Each completed delivery earns five points toward the volunteer's next coupon.
    const volunteer = await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalDeliveries: 1, points: 5 },
    }, { new: true }).select('points totalDeliveries');

    const io = req.app.get('io');
    if (io) io.to(`donor-${foodRequest.donor}`).emit('status-update', {
      status: 'delivered',
      foodRequest,
      proofImage: delivery.proofImage,
    });

    res.json({ success: true, delivery, points: volunteer.points, pointsEarned: 5 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET single request ───────────────────────────────────────────
// GET /api/food-requests/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const request = await FoodRequest.findById(req.params.id)
      .populate('donor', 'name phone email avatar')
      .populate('volunteer', 'name phone avatar');
    if (!request) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
