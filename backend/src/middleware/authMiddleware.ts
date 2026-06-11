import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Admin, { IAdmin } from '../models/Admin';
import Blacklist from '../models/Blacklist';

interface AuthRequest extends Request {
  admin?: IAdmin;
}

interface JwtPayload {
  id: string;
}

const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token = req.cookies?.token;

  // Fallback: accept Bearer token from Authorization header
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

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

    req.admin = (await Admin.findById(decoded.id).select('-password')) as any;

    if (!req.admin) {
      res.status(401).json({ message: 'Not authorized, admin not found' });
      return;
    }

    next();
  } catch (error) {
    console.error('Admin Auth middleware error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export { protect };
