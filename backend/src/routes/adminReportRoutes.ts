import { Router } from 'express';
import { getAllReports, getReportById, updateReportStatus } from '../controllers/adminReportController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getAllReports);
router.get('/:id', protect, getReportById);
router.put('/:id/status', protect, updateReportStatus);

export default router;
