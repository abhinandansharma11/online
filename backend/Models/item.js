const mongoose = require('mongoose');


const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String },
  category: { type: String, required: true },
  available: { type: Boolean, default: true },
});

module.exports = mongoose.model('Item', itemSchema);
