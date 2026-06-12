import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import SecurityGuard, { ISecurityGuard } from '../models/SecurityGuard';
import Blacklist from '../models/Blacklist';

interface GuardAuthRequest extends Request {
  guard?: ISecurityGuard;
}

const generateToken = (id: string, expiresIn: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeyforparkingmanagement', {
    expiresIn: expiresIn as any,
  });
};

const loginSecurity = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password' });
      return;
    }

    const guard = await SecurityGuard.findOne({ email: email.trim().toLowerCase() });

    if (!guard) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (guard.status === 'deactivated') {
      res.status(403).json({ message: 'Account deactivated' });
      return;
    }

    if (guard.lockUntil && guard.lockUntil.getTime() > Date.now()) {
      const diffMs = guard.lockUntil.getTime() - Date.now();
      const mins = Math.max(1, Math.ceil(diffMs / (60 * 1000)));
      res.status(403).json({ message: `Account locked. Try again in ${mins} minutes` });
      return;
    }

    if (await guard.matchPassword(password)) {
      guard.loginAttempts = 0;
      guard.lockUntil = undefined;
      await guard.save();

      const token = generateToken(String(guard._id), '12h');
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 12 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      });

      res.json({
        role: 'security',
        _id: guard._id,
        name: guard.name,
        email: guard.email,
        phone: guard.phone,
        token,
      });
    } else {
      guard.loginAttempts = (guard.loginAttempts || 0) + 1;
      if (guard.loginAttempts >= 5) {
        guard.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      await guard.save();

      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const getSecurityProfile = async (req: GuardAuthRequest, res: Response): Promise<void> => {
  try {
    const guard = await SecurityGuard.findById(req.guard!._id).select('-password');
    if (guard) {
      res.json(guard);
    } else {
      res.status(404).json({ message: 'Guard not found' });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export { loginSecurity, getSecurityProfile };
