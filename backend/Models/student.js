const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StudentSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /[^@\s]+@[^@\s]+\.[^@\s]+/
  },
  // renamed from username -> name (not unique)
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  // Email verification fields
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Student', StudentSchema);
