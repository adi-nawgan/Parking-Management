import { Router } from 'express';
const router = Router();
import { loginSecurity, getSecurityProfile } from '../controllers/securityController';
import { protectGuard } from '../middleware/securityAuth';
import { loginLimiter } from '../middleware/rateLimiter';

router.post('/login', loginLimiter, loginSecurity);
router.get('/profile', protectGuard, getSecurityProfile);

export default router;
