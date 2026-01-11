const { validationResult } = require('express-validator');
const Item = require('../Models/item');

exports.getAllItems = async (req, res, next) => {
  try {
    const items = await Item.find();
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

exports.addItem = async (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid input', errors: errors.array() });
  try {
    const item = new Item({
      name: req.body.name,
      price: req.body.price,
      category: req.body.category,
      imageUrl: req.file?.path
    });
    await item.save();
    // Emit menuUpdated event to all clients
    const io = req.app.get('io');
    io.emit('menuUpdated');
    res.json({ success: true, message: 'Item added', data: item });
  } catch (err) {
    next(err);
  }
};



exports.updateItem = async (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    const update = { ...req.body };
    if (req.file) update.imageUrl = req.file.path;
    const item = await Item.findByIdAndUpdate(req.params.id, update, { new: true });
    // Emit menuUpdated event to all clients
    const io = req.app.get('io');
    io.emit('menuUpdated');
    res.json({ success: true, message: 'Item updated', data: item });
  } catch (err) {
    next(err);
  }
};

// Toggle item availability
exports.toggleAvailability = async (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    item.available = !item.available;
    await item.save();
    // Emit real-time event
    const io = req.app.get('io');
    io.emit('itemAvailabilityChanged', { itemId: item._id, available: item.available });
    res.json({ success: true, message: 'Availability toggled', data: item });
  } catch (err) {
    next(err);
  }
};

// Remove item (delete)
exports.removeItem = async (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    // Emit real-time event
    const io = req.app.get('io');
    io.emit('itemRemoved', { itemId: req.params.id });
    res.json({ success: true, message: 'Item removed' });
  } catch (err) {
    next(err);
  }
};

// Mark all items as not available (admin only)
exports.markAllNotAvailable = async (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    await Item.updateMany({}, { $set: { available: false } });
    const io = req.app.get('io');
    if (io) io.emit('menuUpdated'); // clients refetch menu
    res.json({ success: true, message: 'All items marked as not available' });
  } catch (err) {
    next(err);
  }
};

// Mark all items as available (admin only)
exports.markAllAvailable = async (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    await Item.updateMany({}, { $set: { available: true } });
    const io = req.app.get('io');
    if (io) io.emit('menuUpdated'); // clients refetch menu
    res.json({ success: true, message: 'All items marked as available' });
  } catch (err) {
    next(err);
  }
};
