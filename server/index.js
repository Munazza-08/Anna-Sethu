// ─────────────────────────────────────────────────────────────
//  Anna Sethu — Backend Entry Point
//  Connects to MongoDB, registers routes, starts Socket.IO server
// ─────────────────────────────────────────────────────────────
const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const http    = require('http');
const { Server } = require('socket.io');
const path    = require('path');
const connectDB = require('./config/db');

// Load environment variables FIRST
dotenv.config();

// Connect to MongoDB
connectDB();

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

  // Donor joins a room to receive updates about their requests
  socket.on('join-donor-room', (donorId) => {
    socket.join(`donor-${donorId}`);
    console.log(`🏠 Donor ${donorId} joined room`);
  });

  // Volunteer broadcasts live location to the donor watching the request
  socket.on('volunteer-location', ({ donorId, lat, lng, requestId }) => {
    io.to(`donor-${donorId}`).emit('volunteer-location-update', { lat, lng, requestId });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
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
server.listen(PORT, () => {
  console.log(`🚀 Anna Sethu server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.IO ready`);
});
