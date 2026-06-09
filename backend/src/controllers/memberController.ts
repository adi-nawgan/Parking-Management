import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Member from '../models/Member';
import ParkingReport from '../models/ParkingReport';
import Resident from '../models/Resident';
import CurrentlyParked from '../models/CurrentlyParked';
import Settings from '../models/Settings';
import { AuthRequest } from '../middleware/memberAuth';

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeyforparkingmanagement', {
    expiresIn: '1d',
  });
};

const registerMember = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, phone, buildingNumber, flatNumber } = req.body;

  try {
    if (!name || !password || !phone || !buildingNumber || !flatNumber) {
      res.status(400).json({ message: 'All fields (except email) are required' });
      return;
    }

    const cleanPhone = phone.trim();
    const existingPhone = await Member.findOne({ phone: cleanPhone });
    if (existingPhone) {
      res.status(400).json({ message: 'A member with this phone number already exists' });
      return;
    }

    if (email && email.trim() !== '') {
      const cleanEmail = email.toLowerCase().trim();
      const existingEmail = await Member.findOne({ email: cleanEmail });
      if (existingEmail) {
        res.status(400).json({ message: 'A member with this email already exists' });
        return;
      }
    }

    const memberData: Record<string, unknown> = {
      name,
      password,
      phone: cleanPhone,
      buildingNumber,
      flatNumber,
    };
    if (email && email.trim() !== '') {
      memberData.email = email.toLowerCase().trim();
    }

    const member = await Member.create(memberData);

    // Automatically ensure a Resident profile exists in the database for the admin to see/manage
    const existingResident = await Resident.findOne({ buildingNumber, flatNumber });
    if (!existingResident) {
      await Resident.create({
        buildingNumber,
        flatNumber,
        ownerName: name,
        phone: cleanPhone,
        type: 'resident',
        vehicles: [],
      });
    }

    res.status(201).json({
      _id: member._id,
      name: member.name,
      email: member.email || '',
      phone: member.phone,
      buildingNumber: member.buildingNumber,
      flatNumber: member.flatNumber,
      token: generateToken(String(member._id)),
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const loginMember = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body; // email could be phone or email

  try {
    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email/phone and password' });
      return;
    }

    const cleanEmailOrPhone = email.trim();
    const member = await Member.findOne({
      $or: [
        { email: cleanEmailOrPhone.toLowerCase() },
        { phone: cleanEmailOrPhone }
      ]
    });

    if (member && (await member.matchPassword(password))) {
      res.json({
        _id: member._id,
        name: member.name,
        email: member.email || '',
        phone: member.phone,
        buildingNumber: member.buildingNumber,
        flatNumber: member.flatNumber,
        token: generateToken(String(member._id)),
      });
    } else {
      res.status(401).json({ message: 'Invalid email/phone or password' });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const getMemberProfile = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const member = await Member.findById(authReq.member!._id).select('-password');
    if (member) {
      res.json(member);
    } else {
      res.status(404).json({ message: 'Member not found' });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const getParkingSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = (await Settings.findOne()) || ({ totalCapacity: 60, overflowLimit: 68 } as { totalCapacity: number; overflowLimit: number });
    const count = await CurrentlyParked.countDocuments();
    const available = Math.max(0, settings.totalCapacity - count);

    res.json({
      totalCapacity: settings.totalCapacity,
      currentlyParkedCount: count,
      availableSpots: available,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const searchPlateOwner = async (req: Request, res: Response): Promise<void> => {
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

    const results = [];
    for (const resident of residents) {
      for (const vehicle of resident.vehicles) {
        if (vehicle.plate.includes(cleanPlate)) {
          results.push({
            plate: vehicle.plate,
            ownerName: resident.ownerName,
            phone: resident.phone,
            buildingNumber: resident.buildingNumber,
          });
        }
      }
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const createReport = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { plate, reportType, description, location } = req.body;

  try {
    if (!reportType || !description || !location) {
      res.status(400).json({ message: 'Report type, description, and location are required' });
      return;
    }

    let parsedLocation = location;
    if (typeof location === 'string') {
      try { parsedLocation = JSON.parse(location); } catch { /* ignore */ }
    }

    const photoUrl = req.file ? `/uploads/reports/${req.file.filename}` : undefined;

    const report = await ParkingReport.create({
      reportedBy: authReq.member!._id,
      plate: plate ? (plate as string).toUpperCase().trim() : undefined,
      reportType,
      description,
      photoUrl,
      location: parsedLocation,
      status: 'pending',
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const getMyReports = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const reports = await ParkingReport.find({ reportedBy: authReq.member!._id })
      .populate('reportedBy', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export { registerMember, loginMember, getMemberProfile, getParkingSummary, searchPlateOwner, createReport, getMyReports };
