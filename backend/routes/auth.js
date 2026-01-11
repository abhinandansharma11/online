const express = require('express');
const { body } = require('express-validator');
const authController = require('../Controllers/auth');
const router = express.Router();
// Token validation
router.get('/validate', authController.validateToken);

// Student login (by email)
router.post('/student/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], authController.studentLogin);

// Admin login (username, lowercased in controller)
router.post('/admin/login', [
  body('username').notEmpty(),
  body('password').notEmpty()
], authController.adminLogin);

// Forgot password - send reset token
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], authController.forgotPassword);

// Reset password
router.post('/reset-password', [
  body('token').isLength({ min: 6, max: 6 }).isNumeric(),
  body('newPassword').isLength({ min: 6 }),
  body('confirmPassword').isLength({ min: 6 })
], authController.resetPassword);

module.exports = router;
