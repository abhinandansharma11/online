const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  items: [
    {
      item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
      quantity: { type: Number, required: true }
    }
  ],
  rollNo: { type: String, required: true },
  paymentScreenshot: { type: String },
  orderId: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['pending', 'waiting', 'confirmed', 'cancelled', 'prepared', 'ready', 'delivered', 'rejected'],
    default: 'waiting'
  },
  hostelTag: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 12 } // TTL: 12 hours
});

module.exports = mongoose.model('Order', orderSchema);
