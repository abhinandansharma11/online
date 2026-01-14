// db.js
const mongoose = require('mongoose');

// Use environment variable with fallback
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/adminpanel';

const connectDB = async () => {
  try {
    console.log('[DB] Attempting to connect to MongoDB...');
    console.log('[DB] URI Host:', MONGO_URI.split('@')[1]?.split('/')[0] || 'localhost');
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increased to 30 seconds
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      retryWrites: true,
    });

    console.log('[DB] MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('[DB] MongoDB connection error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('[DB] Cannot connect to MongoDB - server refused connection');
      console.error('[DB] Check MONGO_URI and MongoDB credentials');
    } else if (error.message.includes('authentication failed')) {
      console.error('[DB] MongoDB authentication failed - check credentials in MONGO_URI');
    } else if (error.message.includes('getaddrinfo')) {
      console.error('[DB] Cannot resolve MongoDB hostname - check internet connection');
    }
    console.error('[DB] Full error:', error);
    return false;
  }
};

module.exports = connectDB;
