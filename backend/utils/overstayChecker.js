const cron = require('node-cron');
const CurrentlyParked = require('../models/CurrentlyParked');
const Settings = require('../models/Settings');
const { sendOverstayEmail } = require('./nodemailer');

const checkOverstays = async () => {
  console.log('[Overstay Monitor] Running active vehicle parking check...');
  
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      console.log('[Overstay Monitor] Settings not found, skipping check.');
      return;
    }

    const overstayLimitMinutes = settings.overstayLimit; // stored in minutes
    if (!overstayLimitMinutes || overstayLimitMinutes <= 0) {
      console.log('[Overstay Monitor] Overstay limit is disabled or zero.');
      return;
    }

    const now = new Date();
    const thresholdDate = new Date(now.getTime() - overstayLimitMinutes * 60 * 1000);

    // Find all vehicles parked BEFORE the threshold date that haven't received alerts yet
    const overstayedVehicles = await CurrentlyParked.find({
      entryTime: { $lt: thresholdDate },
      overstayAlertSent: false
    });

    if (overstayedVehicles.length === 0) {
      console.log('[Overstay Monitor] No new overstaying vehicles detected.');
      return;
    }

    console.log(`[Overstay Monitor] Found ${overstayedVehicles.length} vehicles exceeding the limit.`);

    for (const vehicle of overstayedVehicles) {
      try {
        console.log(`[Overstay Monitor] Sending alert for vehicle ${vehicle.plate} (Building ${vehicle.buildingNumber}, Flat ${vehicle.flatNumber})...`);
        
        // Dispatch email
        const emailSent = await sendOverstayEmail(
          vehicle.plate,
          vehicle.buildingNumber,
          vehicle.flatNumber,
          vehicle.entryTime,
          overstayLimitMinutes,
          settings.adminEmail
        );

        if (emailSent) {
          // Set flag in DB to avoid double alerting
          vehicle.overstayAlertSent = true;
          await vehicle.save();
        }
      } catch (err) {
        console.error(`[Overstay Monitor] Failed to process alert for ${vehicle.plate}: ${err.message}`);
      }
    }
  } catch (error) {
    console.error(`[Overstay Monitor] Error during scanning: ${error.message}`);
  }
};

// Start the cron job to run every 5 minutes
const startOverstayChecker = () => {
  // '*/5 * * * *' = every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    checkOverstays();
  });
  console.log('[Overstay Monitor] Cron job scheduled (Runs every 5 minutes).');
  
  // Run once immediately on start
  setTimeout(checkOverstays, 5000);
};

module.exports = {
  startOverstayChecker,
  checkOverstays
};
