const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Health-check endpoint — tells us the server is alive and running.
 * Returns server status, environment, and current timestamp.
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🍱 Anna Sethu Server is running!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

module.exports = router;
