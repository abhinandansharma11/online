const express = require('express');
const auth = require('../middleware/auth');
const adminController = require('../Controllers/admin');
const router = express.Router();

// Example: Get admin dashboard data
router.get('/dashboard', auth, adminController.getDashboard);

module.exports = router;
