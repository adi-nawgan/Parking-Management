import { Router } from 'express';
const router = Router();
import { loginAdmin, getAdminProfile } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

router.post('/login', loginAdmin);
router.get('/profile', protect, getAdminProfile);

export default router;
