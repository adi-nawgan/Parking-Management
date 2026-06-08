const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  plate: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  vehicleType: {
    type: String, // e.g. Car, SUV, Bike
    required: true,
    default: 'Car'
  },
  color: {
    type: String,
    required: true,
    default: 'Unknown'
  }
});

const residentSchema = new mongoose.Schema({
  buildingNumber: {
    type: Number,
    required: true,
    min: 28,
    max: 37
  },
  flatNumber: {
    type: String,
    required: true,
    trim: true
  },
  ownerName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['resident', 'tenant'],
    required: true,
    default: 'resident'
  },
  vehicles: {
    type: [vehicleSchema],
    validate: [v => v.length <= 3, 'A resident can have at most 3 vehicles']
  }
}, {
  timestamps: true
});

// Set text index for easy search by flatNumber, ownerName, and plate
residentSchema.index({ flatNumber: 'text', ownerName: 'text', 'vehicles.plate': 'text' });
residentSchema.index({ 'vehicles.plate': 1 }); // unique index isn't used here because multiple flats can have vehicles or just fast lookup

module.exports = mongoose.model('Resident', residentSchema);
