const mongoose = require('mongoose');

/**
 * connectDB - Establishes a connection to MongoDB using Mongoose.
 * The URI is loaded from the .env file to keep credentials secure.
 * This function is called once when the server starts.
 *
 * The API depends on MongoDB, so connection failures must reach the caller
 * and prevent the server from accepting requests.
 */
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set. Add a valid MongoDB connection string to server/.env.');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
  console.error('MongoDB connection error:', error.message);

  if (error.reason && error.reason.servers) {
    for (const [address, server] of error.reason.servers) {
      console.error('\nServer:', address);
      console.error('Server error:', server.error?.message);
      console.error('Error code:', server.error?.code);
      console.error('Error name:', server.error?.name);
    }
  }

  throw new Error(
    `MongoDB connection failed: ${error.message}`,
    { cause: error }
  );
}

};

module.exports = connectDB;
