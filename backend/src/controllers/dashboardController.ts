import { Request, Response } from 'express';
import CurrentlyParked from '../models/CurrentlyParked';
import Resident from '../models/Resident';
import Log from '../models/Log';
import OverflowLog from '../models/OverflowLog';
import Settings, { ISettings } from '../models/Settings';
import { emitCapacityUpdate, emitVehicleEntry, emitVehicleExit } from '../utils/socket';
import { sendFullAlertEmail } from '../utils/nodemailer';

type CapacityState = 'normal' | 'overflow' | 'full';

const getCapacityState = (count: number, totalCapacity: number, overflowLimit: number): CapacityState => {
  if (count < totalCapacity) {
    return 'normal';
  } else if (count >= totalCapacity && count < overflowLimit) {
    return 'overflow';
  } else {
    return 'full';
  }
};

const handleStateTransition = async (oldCount: number, newCount: number, settings: ISettings): Promise<CapacityState> => {
  const oldState = getCapacityState(oldCount, settings.totalCapacity, settings.overflowLimit);
  const newState = getCapacityState(newCount, settings.totalCapacity, settings.overflowLimit);

  if (oldState !== newState) {
    console.log(`Capacity State Transition: ${oldState.toUpperCase()} -> ${newState.toUpperCase()} (${newCount} vehicles inside)`);

    if (newState === 'overflow' || newState === 'full') {
      await OverflowLog.create({
        count: newCount,
        state: newState,
      });
    }

    if (newState === 'full' && oldState !== 'full') {
      await sendFullAlertEmail(newCount, settings.overflowLimit, settings.adminEmail);
    }
  }
  return newState;
};

const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = (await Settings.findOne()) || ({ totalCapacity: 60, overflowLimit: 68 } as ISettings);
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
      currentlyParkedList: list,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const searchPlate = async (req: Request, res: Response): Promise<void> => {
  const { plate } = req.query as Record<string, string | undefined>;

  if (!plate || plate.trim() === '') {
    res.json([]);
    return;
  }

  try {
    const cleanPlate = plate.toUpperCase().trim();
    const residents = await Resident.find({
      'vehicles.plate': { $regex: cleanPlate },
    }).lean();

    const results: Record<string, unknown>[] = [];
    residents.forEach(res => {
      res.vehicles.forEach(veh => {
        if (veh.plate.includes(cleanPlate)) {
          results.push({
            residentId: res._id,
            ownerName: res.ownerName,
            flatNumber: res.flatNumber,
            buildingNumber: res.buildingNumber,
            phone: res.phone,
            type: res.type,
            vehicle: veh,
          });
        }
      });
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const recordVehicleEntry = async (req: Request, res: Response): Promise<void> => {
  const { plate, type, flatNumber, buildingNumber, residentId, visitorDetails } = req.body;

  try {
    if (!plate || !type || !flatNumber || !buildingNumber) {
      res.status(400).json({ message: 'Plate number, vehicle type, building number, and flat number are required' });
      return;
    }

    const cleanPlate = (plate as string).toUpperCase().trim();

    const isAlreadyParked = await CurrentlyParked.findOne({ plate: cleanPlate });
    if (isAlreadyParked) {
      res.status(400).json({ message: `Vehicle ${cleanPlate} is already registered as parked inside` });
      return;
    }

    const settings = (await Settings.findOne()) || ({ totalCapacity: 60, overflowLimit: 68 } as ISettings);
    const oldCount = await CurrentlyParked.countDocuments();

    const entry = new CurrentlyParked({
      plate: cleanPlate,
      type,
      flatNumber,
      buildingNumber,
      residentId: residentId || null,
      visitorDetails: type === 'visitor' ? visitorDetails : null,
      entryTime: new Date(),
    });

    const savedEntry = await entry.save();

    const newCount = oldCount + 1;
    const state = await handleStateTransition(oldCount, newCount, settings);

    if (savedEntry.residentId) {
      await savedEntry.populate('residentId');
    }

    emitVehicleEntry(savedEntry.toObject());
    emitCapacityUpdate({
      currentlyParkedCount: newCount,
      availableSpots: Math.max(0, settings.totalCapacity - newCount),
      state,
    });

    res.status(201).json(savedEntry);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const recordVehicleExit = async (req: Request, res: Response): Promise<void> => {
  const { plate } = req.body;

  try {
    if (!plate) {
      res.status(400).json({ message: 'Plate number is required' });
      return;
    }

    const cleanPlate = (plate as string).toUpperCase().trim();
    const parkedVehicle = await CurrentlyParked.findOne({ plate: cleanPlate });

    if (!parkedVehicle) {
      res.status(404).json({ message: `Vehicle ${cleanPlate} is not currently parked inside` });
      return;
    }

    const settings = (await Settings.findOne()) || ({ totalCapacity: 60, overflowLimit: 68 } as ISettings);
    const oldCount = await CurrentlyParked.countDocuments();

    const exitTime = new Date();
    const durationMs = exitTime.getTime() - new Date(parkedVehicle.entryTime).getTime();
    const durationMinutes = Math.max(1, Math.round(durationMs / (1000 * 60)));

    const log = new Log({
      plate: parkedVehicle.plate,
      type: parkedVehicle.type,
      flatNumber: parkedVehicle.flatNumber,
      buildingNumber: parkedVehicle.buildingNumber || 28,
      entryTime: parkedVehicle.entryTime,
      exitTime,
      duration: durationMinutes,
      residentId: parkedVehicle.residentId,
      visitorDetails: parkedVehicle.visitorDetails,
    });

    const savedLog = await log.save();

    await CurrentlyParked.deleteOne({ _id: parkedVehicle._id });

    const newCount = oldCount - 1;
    const state = await handleStateTransition(oldCount, newCount, settings);

    emitVehicleExit(savedLog.toObject());
    emitCapacityUpdate({
      currentlyParkedCount: newCount,
      availableSpots: Math.max(0, settings.totalCapacity - newCount),
      state,
    });

    res.json({ message: 'Vehicle exited successfully', log: savedLog });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export { getDashboardSummary, searchPlate, recordVehicleEntry, recordVehicleExit };
