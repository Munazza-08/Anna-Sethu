// ─────────────────────────────────────────────────────────────
//  Anna Sethu — Backend Entry Point
//  Connects to MongoDB, registers routes, starts Socket.IO server
// ─────────────────────────────────────────────────────────────
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const http    = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const path    = require('path');
const connectDB = require('./config/db');
const FoodRequest = require('./models/FoodRequest');

// Load environment variables FIRST
dotenv.config();

const app = express();
const server = http.createServer(app);

// ── Socket.IO Setup ───────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach io to app so routes can emit events
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Donor joins their personal room
  socket.on('join-donor-room', (donorId) => {
    if (typeof donorId !== 'string' || donorId !== socket.userId) return;

    socket.join(`donor-${donorId}`);
    console.log(`🏠 Donor ${donorId} joined room`);
  });

  // Donor joins the tracking room for a particular food request
  socket.on('join-tracking-room', async ({ requestId } = {}) => {
    if (typeof requestId !== 'string' || !requestId.trim()) return;

    const foodRequest = await FoodRequest.findOne({ _id: requestId, donor: socket.userId })
      .select('volunteerLocation');
    if (!foodRequest) return;

    socket.join(`tracking-${requestId}`);
    console.log(`📍 Tracking request ${requestId}`);
    if (foodRequest.volunteerLocation?.lat != null && foodRequest.volunteerLocation?.lng != null) {
      socket.emit('volunteer-location-update', {
        requestId,
        lat: foodRequest.volunteerLocation.lat,
        lng: foodRequest.volunteerLocation.lng,
      });
    }
  });

  // Volunteer sends GPS coordinates for a request
  socket.on('volunteer-location', async ({ requestId, lat, lng } = {}) => {
    if (
      typeof requestId !== 'string' ||
      !requestId.trim() ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 || lat > 90 ||
      lng < -180 || lng > 180
    ) {
      return;
    }

    const foodRequest = await FoodRequest.findOneAndUpdate(
      { _id: requestId, volunteer: socket.userId, status: { $in: ['accepted', 'in_transit'] } },
      { $set: { volunteerLocation: { lat, lng } } },
      { new: true, select: 'volunteerLocation' }
    );
    if (!foodRequest) return;

    io.to(`tracking-${requestId}`).emit(
      'volunteer-location-update',
      {
        requestId,
        lat,
        lng,
        updatedAt: Date.now()
      }
    );
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Invalid or expired authentication token'));
  }
});

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────
app.use('/api', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/food-requests', require('./routes/foodRequests'));
app.use('/api/users', require('./routes/users'));

// 404 catch-all
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Anna Sethu server running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 Socket.IO ready`);
    });
  } catch (error) {
    console.error(`❌ ${error.message}`);
    console.error('Check server/.env, MongoDB network access, and that MongoDB is running.');
    process.exitCode = 1;
  }
};

startServer();
