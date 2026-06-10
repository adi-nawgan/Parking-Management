import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Member, { IMember } from '../models/Member';
import Blacklist from '../models/Blacklist';

interface AuthRequest extends Request {
  member?: IMember;
}

interface JwtPayload {
  id: string;
}

const protectMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
    return;
  }

  try {
    // Check if token is blacklisted
    const isBlacklisted = await Blacklist.findOne({ token });
    if (isBlacklisted) {
      res.status(401).json({ message: 'Not authorized, session invalidated' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforparkingmanagement') as JwtPayload;

    const member = await Member.findById(decoded.id).select('-password');
    if (!member) {
      res.status(401).json({ message: 'Not authorized, member not found' });
      return;
    }

    // Verify account status
    if (member.status === 'deactivated') {
      res.status(403).json({ message: 'Account deactivated' });
      return;
    }

    (req as AuthRequest).member = member;
    next();
  } catch (error) {
    console.error('Member Auth middleware error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export { protectMember, AuthRequest };
