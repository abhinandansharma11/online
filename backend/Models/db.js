// db.js
const mongoose = require('mongoose');

// Use environment variable with fallback
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/adminpanel';

const connectDB = async () => {
  try {
    console.log('[DB] Attempting to connect to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 10000,
    });

    console.log('[DB] MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('[DB] MongoDB connection error:', error.message);
    console.error('[DB] Full error:', error);
    // Don't exit - let the app start anyway
    return false;
  }
};

module.exports = connectDB;
