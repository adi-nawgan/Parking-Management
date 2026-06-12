import { Request, Response } from 'express';
import SecurityGuard from '../models/SecurityGuard';

const createGuard = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, phone } = req.body;

  try {
    if (!name || !email || !password || !phone) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    const existing = await SecurityGuard.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      res.status(400).json({ message: 'A guard with this email already exists' });
      return;
    }

    const guard = await SecurityGuard.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone.trim(),
    });

    res.status(201).json({
      _id: guard._id,
      name: guard.name,
      email: guard.email,
      phone: guard.phone,
      status: guard.status,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const getAllGuards = async (req: Request, res: Response): Promise<void> => {
  try {
    const guards = await SecurityGuard.find().select('-password').sort({ createdAt: -1 });
    res.json(guards);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const toggleGuardStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const guard = await SecurityGuard.findById(req.params.id);
    if (!guard) {
      res.status(404).json({ message: 'Guard not found' });
      return;
    }

    guard.status = guard.status === 'active' ? 'deactivated' : 'active';
    await guard.save();

    res.json({
      _id: guard._id,
      name: guard.name,
      email: guard.email,
      phone: guard.phone,
      status: guard.status,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const deleteGuard = async (req: Request, res: Response): Promise<void> => {
  try {
    const guard = await SecurityGuard.findByIdAndDelete(req.params.id);
    if (!guard) {
      res.status(404).json({ message: 'Guard not found' });
      return;
    }
    res.json({ message: 'Guard deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export { createGuard, getAllGuards, toggleGuardStatus, deleteGuard };
