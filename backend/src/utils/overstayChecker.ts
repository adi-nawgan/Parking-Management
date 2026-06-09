import cron from 'node-cron';
import CurrentlyParked from '../models/CurrentlyParked';
import Settings from '../models/Settings';
import { sendOverstayEmail } from './nodemailer';

const checkOverstays = async (): Promise<void> => {
  console.log('[Overstay Monitor] Running active vehicle parking check...');

  try {
    const settings = await Settings.findOne();
    if (!settings) {
      console.log('[Overstay Monitor] Settings not found, skipping check.');
      return;
    }

    const overstayLimitMinutes = settings.overstayLimit;
    if (!overstayLimitMinutes || overstayLimitMinutes <= 0) {
      console.log('[Overstay Monitor] Overstay limit is disabled or zero.');
      return;
    }

    const now = new Date();
    const thresholdDate = new Date(now.getTime() - overstayLimitMinutes * 60 * 1000);

    const overstayedVehicles = await CurrentlyParked.find({
      entryTime: { $lt: thresholdDate },
      overstayAlertSent: false,
    });

    if (overstayedVehicles.length === 0) {
      console.log('[Overstay Monitor] No new overstaying vehicles detected.');
      return;
    }

    console.log(`[Overstay Monitor] Found ${overstayedVehicles.length} vehicles exceeding the limit.`);

    for (const vehicle of overstayedVehicles) {
      try {
        console.log(
          `[Overstay Monitor] Sending alert for vehicle ${vehicle.plate} (Building ${vehicle.buildingNumber}, Flat ${vehicle.flatNumber})...`
        );

        const emailSent = await sendOverstayEmail(
          vehicle.plate,
          vehicle.buildingNumber,
          vehicle.flatNumber,
          vehicle.entryTime,
          overstayLimitMinutes,
          settings.adminEmail
        );

        if (emailSent) {
          vehicle.overstayAlertSent = true;
          await vehicle.save();
        }
      } catch (err) {
        console.error(`[Overstay Monitor] Failed to process alert for ${vehicle.plate}: ${(err as Error).message}`);
      }
    }
  } catch (error) {
    console.error(`[Overstay Monitor] Error during scanning: ${(error as Error).message}`);
  }
};

const startOverstayChecker = (): void => {
  cron.schedule('*/5 * * * *', () => {
    checkOverstays();
  });
  console.log('[Overstay Monitor] Cron job scheduled (Runs every 5 minutes).');

  setTimeout(checkOverstays, 5000);
};

export { startOverstayChecker, checkOverstays };
