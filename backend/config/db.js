const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Settings = require('../models/Settings');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spms_db');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Seed default admin and settings
    await seedDefaultData();
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

const seedDefaultData = async () => {
  try {
    // 1. Seed Settings
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({
        totalCapacity: 60,
        overflowLimit: 68,
        overstayLimit: 1440, // 24 hours in minutes
        adminEmail: 'admin@society.com'
      });
      console.log('Default settings seeded successfully.');
    }

    // 2. Seed Admin
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      // Password will be automatically hashed by Mongoose pre-save hook
      await Admin.create({
        email: 'admin@society.com',
        password: 'adminpassword123'
      });
      console.log('Default Admin seeded successfully: admin@society.com / adminpassword123');
    }
  } catch (err) {
    console.error(`Seeding error: ${err.message}`);
  }
};

module.exports = connectDB;
