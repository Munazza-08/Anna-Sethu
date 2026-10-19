const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @route  POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || typeof phone !== 'string') {
      return res.status(400).json({ success: false, message: 'Enter valid registration details' });
    }
    if (!['donor', 'volunteer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Choose a valid account type' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^(?!.*\.\.)[A-Z0-9](?:[A-Z0-9._%+-]{0,62}[A-Z0-9])?@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z]{2,})+$/i;
    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address' });
    }

    const phoneDigits = phone.replace(/\D/g, '');
    const indianPhoneDigits = phoneDigits.startsWith('91') && phoneDigits.length === 12
      ? phoneDigits.slice(2)
      : phoneDigits;
    if (!/^[6-9]\d{9}$/.test(indianPhoneDigits)) {
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit Indian phone number' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must contain at least 2 characters' });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const normalizedPhone = `+91${indianPhoneDigits}`;
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password, role, phone: normalizedPhone });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        totalDonations: user.totalDonations,
        totalDeliveries: user.totalDeliveries,
        couponsEarned: user.couponsEarned,
        points: user.points,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        totalDonations: user.totalDonations,
        totalDeliveries: user.totalDeliveries,
        couponsEarned: user.couponsEarned,
        points: user.points,
        isAvailable: user.isAvailable,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @route  PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, address, isAvailable } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address, isAvailable },
      { new: true, select: '-password' }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
