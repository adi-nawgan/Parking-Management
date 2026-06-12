import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Admin, { IAdmin } from '../models/Admin';
import SecurityGuard, { ISecurityGuard } from '../models/SecurityGuard';
import Blacklist from '../models/Blacklist';

interface AuthOrGuardRequest extends Request {
  admin?: IAdmin;
  guard?: ISecurityGuard;
}

interface JwtPayload {
  id: string;
}

const protectAdminOrGuard = async (req: AuthOrGuardRequest, res: Response, next: NextFunction): Promise<void> => {
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

    // Try admin first
    const admin = await Admin.findById(decoded.id).select('-password');
    if (admin) {
      req.admin = admin as any;
      next();
      return;
    }

    // Then try guard
    const guard = await SecurityGuard.findById(decoded.id).select('-password');
    if (guard) {
      if (guard.status === 'deactivated') {
        res.status(403).json({ message: 'Account deactivated' });
        return;
      }
      req.guard = guard as any;
      next();
      return;
    }

    res.status(401).json({ message: 'Not authorized, user not found' });
  } catch (error) {
    console.error('AuthOrGuard middleware error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export { protectAdminOrGuard };
