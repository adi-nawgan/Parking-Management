import { Router } from 'express';
const router = Router();
import {
  getDashboardSummary,
  searchPlate,
  recordVehicleEntry,
  recordVehicleExit,
} from '../controllers/dashboardController';
import { protect } from '../middleware/authMiddleware';
import { protectAdminOrGuard } from '../middleware/authOrGuard';

router.get('/summary', protect, getDashboardSummary);
router.get('/search-plate', protect, searchPlate);
router.post('/entry', protectAdminOrGuard, recordVehicleEntry);
router.post('/exit', protectAdminOrGuard, recordVehicleExit);

export default router;
