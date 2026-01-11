const express = require('express');
const { body } = require('express-validator');
const ordersController = require('../Controllers/orders');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all orders (admin only)
router.get('/', auth, ordersController.getAllOrders);

// Get my orders (student)
router.get('/my', auth, ordersController.getMyOrders);

// Place order (student)
router.post('/', auth, upload.single('paymentScreenshot'), ordersController.placeOrder);

// Update order status (admin only)
router.put('/:id', auth, [
  body('status').notEmpty()
], ordersController.updateOrderStatus);

module.exports = router;
