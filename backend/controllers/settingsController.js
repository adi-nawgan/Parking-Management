const Settings = require('../models/Settings');
const Admin = require('../models/Admin');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Create default settings if not exists
      settings = await Settings.create({
        totalCapacity: 60,
        overflowLimit: 68,
        overstayLimit: 1440,
        adminEmail: 'admin@society.com'
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res) => {
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

    // If password or admin email is changed, update in Admin model too
    if (adminPassword || adminEmail) {
      const admin = await Admin.findById(req.admin._id);
      if (admin) {
        if (adminEmail) admin.email = adminEmail;
        if (adminPassword) admin.password = adminPassword; // Pre-save hook hashes this
        await admin.save();
      }
    }

    res.json({
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
