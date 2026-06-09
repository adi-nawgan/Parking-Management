import { Router } from 'express';
const router = Router();
import { getSettings, updateSettings } from '../controllers/settingsController';
import { protect } from '../middleware/authMiddleware';

router.route('/')
  .get(protect, getSettings)
  .put(protect, updateSettings);

export default router;
