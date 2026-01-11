const { validationResult } = require('express-validator');
const Student = require('../Models/student');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendEmailVerificationEmail } = require('../utils/emailService');

exports.registerStudent = async (req, res, next) => {
  // Custom error for name length
  const { email, name, password } = req.body;
  if (!name || name.length < 3) {
    return res.status(400).json({ success: false, message: 'Name should be more than 3 letters' });
  }
  // Custom error for password length
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be greater than 6' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid input', errors: errors.array() });
  try {
    
    const totalStudents = await Student.countDocuments();
    if (totalStudents >= 1000) {
      return res.status(403).json({ success: false, message: 'Registration closed – student limit reached. Limit will be increased soon' });
    }

    const lowerEmail = email.toLowerCase();
    const lowerName = name.toLowerCase();

    // Block first-year registrations (emails starting with '25')
    // if (lowerEmail.startsWith('25')) {
    //   return res.status(403).json({ success: false, message: 'Sorry, registration for first-year students is not open yet' });
    // }

    // Check if email already exists
    const existing = await Student.findOne({ email: lowerEmail });
    if (existing) {
      if (existing.isVerified) {
        // Already verified -> ask user to login
        return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
      }
      // Not verified yet -> resend a fresh verification token and return success
      const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
      existing.emailVerificationToken = verificationToken;
      existing.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await existing.save();
      await sendEmailVerificationEmail(existing.email, verificationToken);
      console.log(`Verification email re-sent during registration to: ${existing.email} (${existing.name}) at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      return res.json({
        success: true,
        message: 'Account exists but is not verified. A new verification token has been sent to your email.',
        data: { email: existing.email, name: existing.name }
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    // Generate 6 digit numeric verification token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const student = new Student({
      email: lowerEmail,
      name: lowerName,
      password: hashed,
      isVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
    await student.save();

    // Send verification email
    await sendEmailVerificationEmail(student.email, verificationToken);
    console.log(`New registration: ${student.email} (${student.name}); verification email sent at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

    res.json({ success: true, message: 'Student registered. Verification token sent to email.', data: { name: student.name, email: student.email } });
  } catch (err) {
    next(err);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token required' });
    const student = await Student.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });
    if (!student) return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    student.isVerified = true;
    student.emailVerificationToken = null;
    student.emailVerificationExpires = null;
    await student.save();
    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    const student = await Student.findOne({ email: email.toLowerCase() });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (student.isVerified) return res.status(400).json({ success: false, message: 'Email already verified' });
    // Generate new token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    student.emailVerificationToken = verificationToken;
    student.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await student.save();
    await sendEmailVerificationEmail(student.email, verificationToken);
    console.log(`Verification email re-sent via /resend to: ${student.email} (${student.name}) at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    res.json({ success: true, message: 'Verification token resent.' });
  } catch (err) {
    next(err);
  }
};

exports.getMyProfile = async (req, res, next) => {
  if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    const student = await Student.findById(req.user.id).select('-password');
    res.json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
};
