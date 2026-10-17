const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

const donorOnly = (req, res, next) => {
  if (req.user && req.user.role === 'donor') return next();
  return res.status(403).json({ success: false, message: 'Access restricted to donors only' });
};

const volunteerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'volunteer') return next();
  return res.status(403).json({ success: false, message: 'Access restricted to volunteers only' });
};

module.exports = { protect, donorOnly, volunteerOnly };
