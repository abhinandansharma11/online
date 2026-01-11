const express = require('express');
const { body } = require('express-validator');
const studentsController = require('../Controllers/students');
const auth = require('../middleware/auth');
const router = express.Router();

// Register student
router.post('/register', [
  body('email').isEmail(),
  body('name').notEmpty(),
  body('password').isLength({ min: 6 })
], studentsController.registerStudent);

// Verify email
router.post('/verify-email', [
  body('token').isLength({ min: 6, max: 6 }).isNumeric()
], studentsController.verifyEmail);

// Resend verification
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail()
], studentsController.resendVerification);

// Get my profile (student)
router.get('/me', auth, studentsController.getMyProfile);

module.exports = router;
