import { Router } from 'express';
const router = Router();
import { loginAdmin, unifiedLogin, getAdminProfile } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

router.post('/login', loginAdmin);
router.post('/unified-login', unifiedLogin);
router.get('/profile', protect, getAdminProfile);

export default router;
