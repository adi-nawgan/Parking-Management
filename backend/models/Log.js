const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  plate: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['resident', 'tenant', 'visitor'],
    required: true
  },
  flatNumber: {
    type: String,
    required: true,
    trim: true
  },
  buildingNumber: {
    type: Number,
    required: true,
    min: 28,
    max: 37
  },
  entryTime: {
    type: Date,
    required: true
  },
  exitTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  duration: {
    type: Number, // duration in minutes
    required: true
  },
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    default: null
  },
  visitorDetails: {
    name: { type: String, trim: true },
    flatVisited: { type: String, trim: true },
    purpose: { type: String, trim: true }
  }
}, {
  timestamps: true
});

logSchema.index({ plate: 1 });
logSchema.index({ flatNumber: 1 });
logSchema.index({ entryTime: 1 });
logSchema.index({ exitTime: 1 });

module.exports = mongoose.model('Log', logSchema);
