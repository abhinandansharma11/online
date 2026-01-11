const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const Student = require('../Models/student');
const Admin = require('../Models/admin');
const { sendResetPasswordEmail } = require('../utils/emailService');

// Token validation endpoint
exports.validateToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = null;
    if (decoded.role === 'student') {
      user = await Student.findById(decoded.id);
      if (!user) return res.status(401).json({ success: false, message: 'Invalid token user' });
      return res.json({ success: true, data: { id: user._id, name: user.name, role: decoded.role } });
    } else if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.id);
      if (!user) return res.status(401).json({ success: false, message: 'Invalid token user' });
      return res.json({ success: true, data: { id: user._id, username: user.username, role: decoded.role } });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

exports.studentLogin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid input', errors: errors.array() });
  try {
    const email = (req.body.email || '').toLowerCase();
    const student = await Student.findOne({ email });
    if (!student) return res.status(400).json({ success: false, message: 'Invalid credentials' });
    if (!student.isVerified) return res.status(403).json({ success: false, message: 'Email not verified. Please verify your email before logging in.' });
    const isMatch = await bcrypt.compare(req.body.password, student.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ id: student._id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '2h' });
    console.log(`Student logged in: ${student.email} (${student.name}) at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    res.json({
      success: true,
      token,
      data: {
        id: student._id,
        name: student.name,
        role: 'student'
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.adminLogin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid input', errors: errors.array() });
  try {
    const username = (req.body.username || '').toLowerCase();
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ success: false, message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(req.body.password, admin.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
    console.log(`Admin logged in: ${admin.username} at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    res.json({ success: true, token, data: { username: admin.username, type: 'admin' } });
  } catch (err) {
    next(err);
  }
};

// Forgot password - send reset token via email
exports.forgotPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid input', errors: errors.array() });
  
  try {
    const { email } = req.body;
    const student = await Student.findOne({ email: email.toLowerCase() });
    if (!student) {
      return res.status(404).json({ success: false, message: 'No account found with this email address' });
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    student.resetPasswordToken = resetToken;
    student.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await student.save();

    const emailResult = await sendResetPasswordEmail(student.email, resetToken);
    
    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again.' });
    }

    console.log(`Password reset email sent to: ${student.email} (${student.name}) at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

    res.json({
      success: true,
      message: 'Password reset token has been sent to your email address. Please check your inbox.'
    });
  } catch (err) {
    next(err);
  }
};

// Simple in-memory rate limit for /reset-password
const resetPasswordAttempts = {};
const RESET_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RESET_MAX_ATTEMPTS = 5;

exports.resetPassword = async (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || '';
  const now = Date.now();
  if (!resetPasswordAttempts[ip]) {
    resetPasswordAttempts[ip] = [];
  }
  // Remove old attempts
  resetPasswordAttempts[ip] = resetPasswordAttempts[ip].filter(ts => now - ts < RESET_WINDOW_MS);
  if (resetPasswordAttempts[ip].length >= RESET_MAX_ATTEMPTS) {
    return res.status(429).json({ success: false, message: 'Too many reset attempts. Please try again later.' });
  }
  resetPasswordAttempts[ip].push(now);

  // Block spamming IP
  if (req.ip === '104.28.212.15' || req.headers['x-forwarded-for'] === '104.28.212.15') {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid input', errors: errors.array() });

  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const student = await Student.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!student) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    student.password = hashedPassword;
    student.resetPasswordToken = null;
    student.resetPasswordExpires = null;

    await student.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (err) {
    next(err);
  }
};
