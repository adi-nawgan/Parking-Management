import { Router } from 'express';
const router = Router();
import { loginAdmin, unifiedLogin, getAdminProfile, logoutUser } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { loginLimiter } from '../middleware/rateLimiter';

router.post('/login', loginLimiter, loginAdmin);
router.post('/unified-login', loginLimiter, unifiedLogin);
router.post('/logout', logoutUser);
router.get('/profile', protect, getAdminProfile);

export default router;
