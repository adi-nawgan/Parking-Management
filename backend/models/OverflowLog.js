const mongoose = require('mongoose');

const overflowLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  count: {
    type: Number,
    required: true
  },
  state: {
    type: String,
    enum: ['overflow', 'full'],
    required: true
  }
});

module.exports = mongoose.model('OverflowLog', overflowLogSchema);
