const mongoose = require('mongoose');

/**
 * connectDB - Establishes a connection to MongoDB using Mongoose.
 * The URI is loaded from the .env file to keep credentials secure.
 * This function is called once when the server starts.
 *
 * NOTE (Phase 1): If MongoDB is not running locally, we log a warning
 * but do NOT exit the process. The health API still works.
 * In production, change the WARNING to process.exit(1).
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️  MongoDB not connected: ${error.message}`);
    console.warn('   → Server continues. API routes that need DB will fail gracefully.');
    console.warn('   → Start MongoDB locally or set MONGO_URI to an Atlas URI in .env');
    // In Phase 2+ uncomment this to make DB connection required:
    // process.exit(1);
  }
};

module.exports = connectDB;
