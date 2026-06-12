import { Router } from 'express';
const router = Router();
import { createGuard, getAllGuards, toggleGuardStatus, deleteGuard } from '../controllers/guardMgmtController';
import { protect } from '../middleware/authMiddleware';

router.get('/', protect, getAllGuards);
router.post('/', protect, createGuard);
router.patch('/:id/status', protect, toggleGuardStatus);
router.delete('/:id', protect, deleteGuard);

export default router;
