import { Router } from 'express';
const router = Router();
import { getVisitorLogs } from '../controllers/visitorController';
import { protectAdminOrGuard } from '../middleware/authOrGuard';

router.get('/', protectAdminOrGuard, getVisitorLogs);

export default router;
