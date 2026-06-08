const Resident = require('../models/Resident');
const CurrentlyParked = require('../models/CurrentlyParked');

// @desc    Get all residents with search & parking status
// @route   GET /api/residents
// @access  Private
const getResidents = async (req, res) => {
  const { search } = req.query;

  try {
    let query = {};

    if (search) {
      // Create partial match query across name, flatNumber, and vehicles.plate
      const regex = new RegExp(search, 'i');
      query = {
        $or: [
          { ownerName: regex },
          { flatNumber: regex },
          { 'vehicles.plate': regex }
        ]
      };
    }

    const residents = await Resident.find(query).lean();

    // Map through residents to attach current parking status
    const populatedResidents = await Promise.all(
      residents.map(async (resident) => {
        const plates = resident.vehicles.map(v => v.plate);
        // Find if any of these plates are currently parked
        const parkedVehicles = await CurrentlyParked.find({
          plate: { $in: plates }
        });

        return {
          ...resident,
          parkedVehicles: parkedVehicles.map(pv => pv.plate),
          isParked: parkedVehicles.length > 0
        };
      })
    );

    res.json(populatedResidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single resident by ID
// @route   GET /api/residents/:id
// @access  Private
const getResidentById = async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id).lean();
    if (!resident) {
      return res.status(404).json({ message: 'Resident/Tenant record not found' });
    }

    const plates = resident.vehicles.map(v => v.plate);
    const parkedVehicles = await CurrentlyParked.find({ plate: { $in: plates } });

    res.json({
      ...resident,
      parkedVehicles: parkedVehicles.map(pv => pv.plate),
      isParked: parkedVehicles.length > 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new resident
// @route   POST /api/residents
// @access  Private
const createResident = async (req, res) => {
  const { buildingNumber, flatNumber, ownerName, phone, type, vehicles } = req.body;

  try {
    // Basic validation
    if (!buildingNumber || !flatNumber || !ownerName || !phone || !type) {
      return res.status(400).json({ message: 'Please provide all required fields (including building number)' });
    }

    if (vehicles && vehicles.length > 3) {
      return res.status(400).json({ message: 'A resident can have at most 3 vehicles' });
    }

    // Check if any plate is already registered
    if (vehicles && vehicles.length > 0) {
      const plates = vehicles.map(v => v.plate.toUpperCase());
      const existing = await Resident.findOne({ 'vehicles.plate': { $in: plates } });
      if (existing) {
        return res.status(400).json({ message: 'One or more vehicle plates are already registered in the system' });
      }
    }

    const resident = new Resident({
      buildingNumber,
      flatNumber,
      ownerName,
      phone,
      type,
      vehicles: vehicles ? vehicles.map(v => ({ ...v, plate: v.plate.toUpperCase() })) : []
    });

    const createdResident = await resident.save();
    res.status(201).json(createdResident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update resident
// @route   PUT /api/residents/:id
// @access  Private
const updateResident = async (req, res) => {
  const { buildingNumber, flatNumber, ownerName, phone, type, vehicles } = req.body;

  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({ message: 'Resident/Tenant record not found' });
    }

    if (vehicles && vehicles.length > 3) {
      return res.status(400).json({ message: 'A resident can have at most 3 vehicles' });
    }

    // Check if any updated plate is already registered to ANOTHER resident
    if (vehicles && vehicles.length > 0) {
      const plates = vehicles.map(v => v.plate.toUpperCase());
      const existing = await Resident.findOne({
        _id: { $ne: req.params.id },
        'vehicles.plate': { $in: plates }
      });
      if (existing) {
        return res.status(400).json({ message: 'One or more vehicle plates are already registered to another resident' });
      }
    }

    resident.buildingNumber = buildingNumber || resident.buildingNumber;
    resident.flatNumber = flatNumber || resident.flatNumber;
    resident.ownerName = ownerName || resident.ownerName;
    resident.phone = phone || resident.phone;
    resident.type = type || resident.type;
    if (vehicles) {
      resident.vehicles = vehicles.map(v => ({ ...v, plate: v.plate.toUpperCase() }));
    }

    const updatedResident = await resident.save();
    res.json(updatedResident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete resident
// @route   DELETE /api/residents/:id
// @access  Private
const deleteResident = async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({ message: 'Resident/Tenant record not found' });
    }

    await Resident.deleteOne({ _id: req.params.id });
    res.json({ message: 'Resident record removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getResidents,
  getResidentById,
  createResident,
  updateResident,
  deleteResident
};
