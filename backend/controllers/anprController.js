const fs = require('fs');
const path = require('path');
const Resident = require('../models/Resident');

// @desc    Process plate detected by ANPR camera
// @route   POST /api/anpr/plate-detected
// @access  Public (Secured with API Key)
const processANPRDetection = async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.ANPR_API_KEY || 'anpr_secret_api_key_123456';

  // Verify API key
  if (!apiKey || apiKey !== expectedApiKey) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or missing ANPR API Key' });
  }

  const { plate, cameraId } = req.body;

  if (!plate) {
    return res.status(400).json({ message: 'Plate number is required' });
  }

  try {
    const cleanPlate = plate.toUpperCase().trim();
    const cleanCameraId = cameraId ? cameraId.toUpperCase().trim() : 'UNKNOWN';

    // Find resident with this plate
    const resident = await Resident.findOne({ 'vehicles.plate': cleanPlate }).lean();

    if (resident) {
      // Find the specific vehicle details
      const vehicle = resident.vehicles.find(v => v.plate === cleanPlate);
      
      return res.json({
        matched: true,
        isVisitor: false,
        residentDetails: {
          id: resident._id,
          ownerName: resident.ownerName,
          flatNumber: resident.flatNumber,
          buildingNumber: resident.buildingNumber,
          phone: resident.phone,
          type: resident.type
        },
        vehicleDetails: vehicle
      });
    } else {
      // Log unrecognized plate to file
      const logsDir = path.join(__dirname, '../logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const logPath = path.join(logsDir, 'unrecognized_plates.log');
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] CAMERA ID: ${cleanCameraId} - UNRECOGNIZED PLATE: ${cleanPlate}\n`;
      
      fs.appendFileSync(logPath, logEntry);
      console.warn(`[ANPR] Unrecognized Plate Detected: ${cleanPlate} from Camera: ${cleanCameraId}`);

      return res.json({
        matched: false,
        isVisitor: true,
        plate: cleanPlate,
        message: 'Plate does not match any registered resident/tenant. Logged as visitor flag.'
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  processANPRDetection
};
