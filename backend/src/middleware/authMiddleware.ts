import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Admin, { IAdmin } from '../models/Admin';
interface AuthRequest extends Request {
  admin?: IAdmin;
}

interface JwtPayload {
  id: string;
}

const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforparkingmanagement') as JwtPayload;

      req.admin = await Admin.findById(decoded.id).select('-password') as any;

      if (!req.admin) {
        res.status(401).json({ message: 'Not authorized, admin not found' });
        return;
      }

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

export { protect };
