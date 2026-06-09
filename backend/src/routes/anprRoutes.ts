import { Router } from 'express';
const router = Router();
import { processANPRDetection } from '../controllers/anprController';

router.post('/plate-detected', processANPRDetection);

export default router;
