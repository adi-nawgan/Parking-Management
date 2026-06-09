import { Request, Response } from 'express';
import Resident, { IResident } from '../models/Resident';
import CurrentlyParked from '../models/CurrentlyParked';

const getResidents = async (req: Request, res: Response): Promise<void> => {
  const { search } = req.query as Record<string, string | undefined>;

  try {
    let query: Record<string, unknown> = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      query = {
        $or: [
          { ownerName: regex },
          { flatNumber: regex },
          { 'vehicles.plate': regex },
        ],
      };
    }

    const residents = await Resident.find(query).lean();

    const populatedResidents = await Promise.all(
      residents.map(async (resident) => {
        const plates = resident.vehicles.map(v => v.plate);
        const parkedVehicles = await CurrentlyParked.find({
          plate: { $in: plates },
        });

        return {
          ...resident,
          parkedVehicles: parkedVehicles.map(pv => pv.plate),
          isParked: parkedVehicles.length > 0,
        };
      })
    );

    res.json(populatedResidents);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const getResidentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const resident = await Resident.findById(req.params.id).lean();
    if (!resident) {
      res.status(404).json({ message: 'Resident/Tenant record not found' });
      return;
    }

    const plates = resident.vehicles.map(v => v.plate);
    const parkedVehicles = await CurrentlyParked.find({ plate: { $in: plates } });

    res.json({
      ...resident,
      parkedVehicles: parkedVehicles.map(pv => pv.plate),
      isParked: parkedVehicles.length > 0,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const createResident = async (req: Request, res: Response): Promise<void> => {
  const { buildingNumber, flatNumber, ownerName, phone, type, vehicles } = req.body;

  try {
    if (!buildingNumber || !flatNumber || !ownerName || !phone || !type) {
      res.status(400).json({ message: 'Please provide all required fields (including building number)' });
      return;
    }

    if (vehicles && vehicles.length > 3) {
      res.status(400).json({ message: 'A resident can have at most 3 vehicles' });
      return;
    }

    if (vehicles && vehicles.length > 0) {
      const plates = vehicles.map((v: { plate: string }) => v.plate.toUpperCase());
      const existing = await Resident.findOne({ 'vehicles.plate': { $in: plates } });
      if (existing) {
        res.status(400).json({ message: 'One or more vehicle plates are already registered in the system' });
        return;
      }
    }

    const resident = new Resident({
      buildingNumber,
      flatNumber,
      ownerName,
      phone,
      type,
      vehicles: vehicles ? vehicles.map((v: { plate: string; [key: string]: unknown }) => ({ ...v, plate: v.plate.toUpperCase() })) : [],
    });

    const createdResident = await resident.save();
    res.status(201).json(createdResident);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const updateResident = async (req: Request, res: Response): Promise<void> => {
  const { buildingNumber, flatNumber, ownerName, phone, type, vehicles } = req.body;

  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      res.status(404).json({ message: 'Resident/Tenant record not found' });
      return;
    }

    if (vehicles && vehicles.length > 3) {
      res.status(400).json({ message: 'A resident can have at most 3 vehicles' });
      return;
    }

    if (vehicles && vehicles.length > 0) {
      const plates = vehicles.map((v: { plate: string }) => v.plate.toUpperCase());
      const existing = await Resident.findOne({
        _id: { $ne: req.params.id },
        'vehicles.plate': { $in: plates },
      });
      if (existing) {
        res.status(400).json({ message: 'One or more vehicle plates are already registered to another resident' });
        return;
      }
    }

    resident.buildingNumber = buildingNumber || resident.buildingNumber;
    resident.flatNumber = flatNumber || resident.flatNumber;
    resident.ownerName = ownerName || resident.ownerName;
    resident.phone = phone || resident.phone;
    resident.type = type || resident.type;
    if (vehicles) {
      resident.vehicles = vehicles.map((v: { plate: string; [key: string]: unknown }) => ({ ...v, plate: v.plate.toUpperCase() }));
    }

    const updatedResident = await resident.save();
    res.json(updatedResident);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const deleteResident = async (req: Request, res: Response): Promise<void> => {
  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      res.status(404).json({ message: 'Resident/Tenant record not found' });
      return;
    }

    await Resident.deleteOne({ _id: req.params.id });
    res.json({ message: 'Resident record removed successfully' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export { getResidents, getResidentById, createResident, updateResident, deleteResident };
