import { Router } from 'express';
const router = Router();
import {
  getDashboardSummary,
  searchPlate,
  recordVehicleEntry,
  recordVehicleExit,
} from '../controllers/dashboardController';
import { protect } from '../middleware/authMiddleware';

router.get('/summary', protect, getDashboardSummary);
router.get('/search-plate', protect, searchPlate);
router.post('/entry', protect, recordVehicleEntry);
router.post('/exit', protect, recordVehicleExit);

export default router;
