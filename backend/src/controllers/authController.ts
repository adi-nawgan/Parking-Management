import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Admin, { IAdmin } from '../models/Admin';
interface AuthRequest extends Request {
  admin?: IAdmin;
}

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeyforparkingmanagement', {
    expiresIn: '1d',
  });
};

const loginAdmin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password' });
      return;
    }

    const admin = await Admin.findOne({ email });

    if (admin && (await admin.matchPassword(password))) {
      res.json({
        _id: admin._id,
        email: admin.email,
        token: generateToken(String(admin._id)),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
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

export { loginAdmin, getAdminProfile };
