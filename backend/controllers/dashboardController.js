const CurrentlyParked = require('../models/CurrentlyParked');
const Resident = require('../models/Resident');
const Log = require('../models/Log');
const OverflowLog = require('../models/OverflowLog');
const Settings = require('../models/Settings');
const { emitCapacityUpdate, emitVehicleEntry, emitVehicleExit } = require('../utils/socket');
const { sendFullAlertEmail } = require('../utils/nodemailer');

// Helper to determine state based on count and settings
const getCapacityState = (count, totalCapacity, overflowLimit) => {
  if (count < totalCapacity) {
    return 'normal';
  } else if (count >= totalCapacity && count < overflowLimit) {
    return 'overflow';
  } else {
    return 'full';
  }
};

// Helper to check and log capacity state transitions
const handleStateTransition = async (oldCount, newCount, settings) => {
  const oldState = getCapacityState(oldCount, settings.totalCapacity, settings.overflowLimit);
  const newState = getCapacityState(newCount, settings.totalCapacity, settings.overflowLimit);

  if (oldState !== newState) {
    console.log(`Capacity State Transition: ${oldState.toUpperCase()} -> ${newState.toUpperCase()} (${newCount} vehicles inside)`);
    
    // Log transitions to overflow or full states
    if (newState === 'overflow' || newState === 'full') {
      await OverflowLog.create({
        count: newCount,
        state: newState
      });
    }

    // If transitioned to FULL, dispatch email alert
    if (newState === 'full' && oldState !== 'full') {
      await sendFullAlertEmail(newCount, settings.overflowLimit, settings.adminEmail);
    }
  }
  return newState;
};

// @desc    Get dashboard summary data
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = async (req, res) => {
  try {
    const settings = await Settings.findOne() || { totalCapacity: 60, overflowLimit: 68 };
    const count = await CurrentlyParked.countDocuments();
    const list = await CurrentlyParked.find().populate('residentId').sort({ entryTime: -1 });

    const state = getCapacityState(count, settings.totalCapacity, settings.overflowLimit);
    const available = Math.max(0, settings.totalCapacity - count);

    res.json({
      totalCapacity: settings.totalCapacity,
      overflowLimit: settings.overflowLimit,
      currentlyParkedCount: count,
      availableSpots: available,
      state,
      currentlyParkedList: list
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search plate for auto-fill in entry form
// @route   GET /api/dashboard/search-plate
// @access  Private
const searchPlate = async (req, res) => {
  const { plate } = req.query;
  
  if (!plate || plate.trim() === '') {
    return res.json([]);
  }

  try {
    const cleanPlate = plate.toUpperCase().trim();
    // Support partial match on vehicle plate
    const residents = await Resident.find({
      'vehicles.plate': { $regex: cleanPlate }
    }).lean();

    // Format response to highlight matched vehicle details
    const results = [];
    residents.forEach(res => {
      res.vehicles.forEach(veh => {
        if (veh.plate.includes(cleanPlate)) {
          results.push({
            residentId: res._id,
            ownerName: res.ownerName,
            flatNumber: res.flatNumber,
            buildingNumber: res.buildingNumber,
            phone: res.phone,
            type: res.type, // resident / tenant
            vehicle: veh
          });
        }
      });
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record vehicle entry
// @route   POST /api/dashboard/entry
// @access  Private
const recordVehicleEntry = async (req, res) => {
  const { plate, type, flatNumber, buildingNumber, residentId, visitorDetails } = req.body;

  try {
    if (!plate || !type || !flatNumber || !buildingNumber) {
      return res.status(400).json({ message: 'Plate number, vehicle type, building number, and flat number are required' });
    }

    const cleanPlate = plate.toUpperCase().trim();

    // Check if vehicle is already parked inside
    const isAlreadyParked = await CurrentlyParked.findOne({ plate: cleanPlate });
    if (isAlreadyParked) {
      return res.status(400).json({ message: `Vehicle ${cleanPlate} is already registered as parked inside` });
    }

    const settings = await Settings.findOne() || { totalCapacity: 60, overflowLimit: 68 };
    const oldCount = await CurrentlyParked.countDocuments();

    // Save entry
    const entry = new CurrentlyParked({
      plate: cleanPlate,
      type,
      flatNumber,
      buildingNumber,
      residentId: residentId || null,
      visitorDetails: type === 'visitor' ? visitorDetails : null,
      entryTime: new Date()
    });

    const savedEntry = await entry.save();
    
    // Check state transition
    const newCount = oldCount + 1;
    const state = await handleStateTransition(oldCount, newCount, settings);

    // Populate residentId if available before socket broadcast
    if (savedEntry.residentId) {
      await savedEntry.populate('residentId');
    }

    // Broadcast Socket.io Updates
    emitVehicleEntry(savedEntry);
    emitCapacityUpdate({
      currentlyParkedCount: newCount,
      availableSpots: Math.max(0, settings.totalCapacity - newCount),
      state
    });

    res.status(201).json(savedEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record vehicle exit
// @route   POST /api/dashboard/exit
// @access  Private
const recordVehicleExit = async (req, res) => {
  const { plate } = req.body;

  try {
    if (!plate) {
      return res.status(400).json({ message: 'Plate number is required' });
    }

    const cleanPlate = plate.toUpperCase().trim();
    const parkedVehicle = await CurrentlyParked.findOne({ plate: cleanPlate });

    if (!parkedVehicle) {
      return res.status(404).json({ message: `Vehicle ${cleanPlate} is not currently parked inside` });
    }

    const settings = await Settings.findOne() || { totalCapacity: 60, overflowLimit: 68 };
    const oldCount = await CurrentlyParked.countDocuments();

    const exitTime = new Date();
    const durationMs = exitTime - new Date(parkedVehicle.entryTime);
    const durationMinutes = Math.max(1, Math.round(durationMs / (1000 * 60))); // Min 1 minute duration

    // Save to permanent Log
    const log = new Log({
      plate: parkedVehicle.plate,
      type: parkedVehicle.type,
      flatNumber: parkedVehicle.flatNumber,
      buildingNumber: parkedVehicle.buildingNumber || 28,
      entryTime: parkedVehicle.entryTime,
      exitTime,
      duration: durationMinutes,
      residentId: parkedVehicle.residentId,
      visitorDetails: parkedVehicle.visitorDetails
    });

    const savedLog = await log.save();
    
    // Remove from CurrentlyParked
    await CurrentlyParked.deleteOne({ _id: parkedVehicle._id });

    // Check state transition
    const newCount = oldCount - 1;
    const state = await handleStateTransition(oldCount, newCount, settings);

    // Broadcast Socket.io Updates
    emitVehicleExit(savedLog);
    emitCapacityUpdate({
      currentlyParkedCount: newCount,
      availableSpots: Math.max(0, settings.totalCapacity - newCount),
      state
    });

    res.json({ message: 'Vehicle exited successfully', log: savedLog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardSummary,
  searchPlate,
  recordVehicleEntry,
  recordVehicleExit
};
