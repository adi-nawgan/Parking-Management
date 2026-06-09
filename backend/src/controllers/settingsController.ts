import { Request, Response } from 'express';
import Settings from '../models/Settings';
import Admin, { IAdmin } from '../models/Admin';
interface AuthRequest extends Request {
  admin?: IAdmin;
}

const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        totalCapacity: 60,
        overflowLimit: 68,
        overstayLimit: 1440,
        adminEmail: 'admin@society.com',
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  const { totalCapacity, overflowLimit, overstayLimit, adminEmail, adminPassword } = req.body;

  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (totalCapacity !== undefined) settings.totalCapacity = totalCapacity;
    if (overflowLimit !== undefined) settings.overflowLimit = overflowLimit;
    if (overstayLimit !== undefined) settings.overstayLimit = overstayLimit;
    if (adminEmail !== undefined) settings.adminEmail = adminEmail;

    await settings.save();

    if (adminPassword || adminEmail) {
      const admin = await Admin.findById(req.admin!._id);
      if (admin) {
        if (adminEmail) admin.email = adminEmail;
        if (adminPassword) admin.password = adminPassword;
        await admin.save();
      }
    }

    res.json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export { getSettings, updateSettings };
