import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import SecurityGuard, { ISecurityGuard } from '../models/SecurityGuard';
import Blacklist from '../models/Blacklist';

interface GuardAuthRequest extends Request {
  guard?: ISecurityGuard;
}

interface JwtPayload {
  id: string;
}

const protectGuard = async (req: GuardAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
    return;
  }

  try {
    const isBlacklisted = await Blacklist.findOne({ token });
    if (isBlacklisted) {
      res.status(401).json({ message: 'Not authorized, session invalidated' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforparkingmanagement') as JwtPayload;

    req.guard = (await SecurityGuard.findById(decoded.id).select('-password')) as any;

    if (!req.guard) {
      res.status(401).json({ message: 'Not authorized, guard not found' });
      return;
    }

    if (req.guard.status === 'deactivated') {
      res.status(403).json({ message: 'Account deactivated' });
      return;
    }

    next();
  } catch (error) {
    console.error('Guard Auth middleware error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export { protectGuard };
