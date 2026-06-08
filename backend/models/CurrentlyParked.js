const mongoose = require('mongoose');

const currentlyParkedSchema = new mongoose.Schema({
  plate: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    unique: true // A vehicle cannot be parked twice at the same time
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
    required: true,
    default: Date.now
  },
  overstayAlertSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

currentlyParkedSchema.index({ plate: 1 });
currentlyParkedSchema.index({ flatNumber: 1 });

module.exports = mongoose.model('CurrentlyParked', currentlyParkedSchema);
