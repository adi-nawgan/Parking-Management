const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  totalCapacity: {
    type: Number,
    required: true,
    default: 60
  },
  overflowLimit: {
    type: Number,
    required: true,
    default: 68
  },
  overstayLimit: {
    type: Number, // In minutes
    required: true,
    default: 1440 // 24 hours
  },
  adminEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
