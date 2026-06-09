import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Member, { IMember } from '../models/Member';

interface AuthRequest extends Request {
  member?: IMember;
}

interface JwtPayload {
  id: string;
}

const protectMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforparkingmanagement') as JwtPayload;

      const member = await Member.findById(decoded.id).select('-password');
      if (!member) {
        res.status(401).json({ message: 'Not authorized, member not found' });
        return;
      }

      (req as AuthRequest).member = member;
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

export { protectMember, AuthRequest };
