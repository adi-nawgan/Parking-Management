import { Router } from 'express';
const router = Router();
import { getVisitorLogs } from '../controllers/visitorController';
import { protect } from '../middleware/authMiddleware';

router.get('/', protect, getVisitorLogs);

export default router;
