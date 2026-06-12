import { Router } from 'express';
const router = Router();
import { getLogs, exportLogsCSV } from '../controllers/logController';
import { protectAdminOrGuard } from '../middleware/authOrGuard';

router.get('/', protectAdminOrGuard, getLogs);
router.get('/export', protectAdminOrGuard, exportLogsCSV);

export default router;
