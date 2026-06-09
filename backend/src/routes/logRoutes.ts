import { Router } from 'express';
const router = Router();
import { getLogs, exportLogsCSV } from '../controllers/logController';
import { protect } from '../middleware/authMiddleware';

router.get('/', protect, getLogs);
router.get('/export', protect, exportLogsCSV);

export default router;
