import mongoose from 'mongoose';
import Admin from '../models/Admin';
import Settings from '../models/Settings';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spms_db');
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    await seedDefaultData();
  } catch (error) {
    console.error(`MongoDB connection error: ${(error as Error).message}`);
    process.exit(1);
  }
};

const seedDefaultData = async (): Promise<void> => {
  try {
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({
        totalCapacity: 60,
        overflowLimit: 68,
        overstayLimit: 1440,
        adminEmail: 'admin@society.com',
      });
      console.log('Default settings seeded successfully.');
    }

    const admin = await Admin.findOne({ email: 'admin@society.com' });
    if (!admin) {
      await Admin.create({ email: 'admin@society.com', password: 'adminpassword123' });
      console.log('Default Admin created: admin@society.com / adminpassword123');
    } else {
      admin.password = 'adminpassword123';
      admin.loginAttempts = 0;
      admin.lockUntil = undefined;
      await admin.save();
      console.log('Default Admin password reset: admin@society.com / adminpassword123');
    }
  } catch (err) {
    console.error(`Seeding error: ${(err as Error).message}`);
  }
};

export default connectDB;
