const express = require('express');
const { body } = require('express-validator');
const itemsController = require('../Controllers/items');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all items
router.get('/', auth, itemsController.getAllItems);

// Add item (admin only)
router.post('/', auth, upload.single('image'), [
  body('name').notEmpty(),
  body('price').isNumeric(),
  body('category').notEmpty()
], itemsController.addItem);


// Update item (admin only)
router.put('/:id', auth, upload.single('image'), itemsController.updateItem);

// Toggle item availability (admin only)
router.patch('/:id/availability', auth, itemsController.toggleAvailability);

// Remove item (admin only)
router.delete('/:id', auth, itemsController.removeItem);

// Mark all items not available (admin only)
router.post('/mark-all-not-available', auth, itemsController.markAllNotAvailable);

// Mark all items available (admin only)
router.post('/mark-all-available', auth, itemsController.markAllAvailable);

module.exports = router;
