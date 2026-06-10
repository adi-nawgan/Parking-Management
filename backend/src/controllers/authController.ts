import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Admin, { IAdmin } from '../models/Admin';
import Member from '../models/Member';
import AuditLog from '../models/AuditLog';
import Blacklist from '../models/Blacklist';

interface AuthRequest extends Request {
  admin?: IAdmin;
}

const generateToken = (id: string, expiresIn: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeyforparkingmanagement', {
    expiresIn: expiresIn as any,
  });
};

const getLockoutRemainingMinutes = (lockUntil: Date): number => {
  const diffMs = lockUntil.getTime() - Date.now();
  return Math.max(1, Math.ceil(diffMs / (60 * 1000)));
};

const loginAdmin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password' });
      return;
    }

    const admin = await Admin.findOne({ email: email.trim().toLowerCase() });

    if (admin && admin.lockUntil && admin.lockUntil.getTime() > Date.now()) {
      const mins = getLockoutRemainingMinutes(admin.lockUntil);
      res.status(403).json({ message: `Account locked. Try again in ${mins} minutes` });
      return;
    }

    if (admin && (await admin.matchPassword(password))) {
      admin.loginAttempts = 0;
      admin.lockUntil = undefined;
      await admin.save();

      const token = generateToken(String(admin._id), '12h');
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 12 * 60 * 60 * 1000,
        sameSite: 'lax',
      });

      res.json({
        _id: admin._id,
        email: admin.email,
        role: 'admin',
      });
    } else {
      let attempts = 0;
      if (admin) {
        admin.loginAttempts = (admin.loginAttempts || 0) + 1;
        if (admin.loginAttempts >= 5) {
          admin.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        }
        await admin.save();
        attempts = admin.loginAttempts;
      }

      await AuditLog.create({
        actionType: 'failed-login',
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        memberName: email,
        memberFlat: 'N/A',
        plateSearched: `Admin login attempt failed. Total attempts: ${attempts}`,
      });

      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const unifiedLogin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body; // email field holds email or phone

  try {
    if (!email || !password) {
      res.status(400).json({ message: 'Please provide credentials' });
      return;
    }

    const cleanIdentifier = email.trim();

    // 1. Check if user is an Admin (Admin always uses email)
    const admin = await Admin.findOne({ email: cleanIdentifier.toLowerCase() });
    if (admin) {
      if (admin.lockUntil && admin.lockUntil.getTime() > Date.now()) {
        const mins = getLockoutRemainingMinutes(admin.lockUntil);
        res.status(403).json({ message: `Account locked. Try again in ${mins} minutes` });
        return;
      }

      if (await admin.matchPassword(password)) {
        admin.loginAttempts = 0;
        admin.lockUntil = undefined;
        await admin.save();

        const token = generateToken(String(admin._id), '12h');
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 12 * 60 * 60 * 1000,
          sameSite: 'lax',
        });

        res.json({
          role: 'admin',
          _id: admin._id,
          email: admin.email,
        });
        return;
      } else {
        admin.loginAttempts = (admin.loginAttempts || 0) + 1;
        if (admin.loginAttempts >= 5) {
          admin.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        }
        await admin.save();

        await AuditLog.create({
          actionType: 'failed-login',
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          memberName: admin.email,
          memberFlat: 'N/A',
          plateSearched: `Admin unified login failed. Total attempts: ${admin.loginAttempts}`,
        });

        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
    }

    // 2. If not admin, check if user is a Member (by phone or email)
    const member = await Member.findOne({
      $or: [
        { email: cleanIdentifier.toLowerCase() },
        { phone: cleanIdentifier }
      ]
    });
    if (member) {
      if (member.status === 'deactivated') {
        res.status(403).json({ message: 'Account deactivated' });
        return;
      }

      if (member.lockUntil && member.lockUntil.getTime() > Date.now()) {
        const mins = getLockoutRemainingMinutes(member.lockUntil);
        res.status(403).json({ message: `Account locked. Try again in ${mins} minutes` });
        return;
      }

      if (await member.matchPassword(password)) {
        member.loginAttempts = 0;
        member.lockUntil = undefined;
        await member.save();

        const token = generateToken(String(member._id), '8h');
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 8 * 60 * 60 * 1000,
          sameSite: 'lax',
        });

        res.json({
          role: 'member',
          _id: member._id,
          name: member.name,
          email: member.email || '',
          phone: member.phone,
          buildingNumber: member.buildingNumber,
          flatNumber: member.flatNumber,
        });
        return;
      } else {
        member.loginAttempts = (member.loginAttempts || 0) + 1;
        if (member.loginAttempts >= 5) {
          member.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        }
        await member.save();

        await AuditLog.create({
          actionType: 'failed-login',
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          memberName: member.name,
          memberFlat: `Bldg ${member.buildingNumber} Flat ${member.flatNumber}`,
          plateSearched: `Member unified login failed. Total attempts: ${member.loginAttempts}`,
        });

        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
    }

    // 3. User not found in either
    await AuditLog.create({
      actionType: 'failed-login',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      memberName: cleanIdentifier,
      memberFlat: 'N/A',
      plateSearched: 'User not found in system',
    });

    res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const logoutUser = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies.token;
  if (token) {
    try {
      await Blacklist.create({ token });
    } catch (err) {
      console.error('Error blacklisting token:', err);
    }
  }

  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

const getAdminProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admin = await Admin.findById(req.admin!._id).select('-password');
    if (admin) {
      res.json(admin);
    } else {
      res.status(404).json({ message: 'Admin not found' });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export { loginAdmin, unifiedLogin, getAdminProfile, logoutUser };
