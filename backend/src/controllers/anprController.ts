import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import Resident from '../models/Resident';

const processANPRDetection = async (req: Request, res: Response): Promise<void> => {
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.ANPR_API_KEY || 'anpr_secret_api_key_123456';

  if (!apiKey || apiKey !== expectedApiKey) {
    res.status(401).json({ message: 'Unauthorized: Invalid or missing ANPR API Key' });
    return;
  }

  const { plate, cameraId } = req.body;

  if (!plate) {
    res.status(400).json({ message: 'Plate number is required' });
    return;
  }

  try {
    const cleanPlate = (plate as string).toUpperCase().trim();
    const cleanCameraId = cameraId ? (cameraId as string).toUpperCase().trim() : 'UNKNOWN';

    const resident = await Resident.findOne({ 'vehicles.plate': cleanPlate }).lean();

    if (resident) {
      const vehicle = resident.vehicles.find(v => v.plate === cleanPlate);

      res.json({
        matched: true,
        isVisitor: false,
        residentDetails: {
          id: resident._id,
          ownerName: resident.ownerName,
          flatNumber: resident.flatNumber,
          buildingNumber: resident.buildingNumber,
          phone: resident.phone,
          type: resident.type,
        },
        vehicleDetails: vehicle,
      });
    } else {
      const logsDir = path.join(__dirname, '../../logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const logPath = path.join(logsDir, 'unrecognized_plates.log');
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] CAMERA ID: ${cleanCameraId} - UNRECOGNIZED PLATE: ${cleanPlate}\n`;

      fs.appendFileSync(logPath, logEntry);
      console.warn(`[ANPR] Unrecognized Plate Detected: ${cleanPlate} from Camera: ${cleanCameraId}`);

      res.json({
        matched: false,
        isVisitor: true,
        plate: cleanPlate,
        message: 'Plate does not match any registered resident/tenant. Logged as visitor flag.',
      });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export { processANPRDetection };
