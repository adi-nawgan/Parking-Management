import { Router } from 'express';
import {
  getAuditLogs,
  getMembersList,
  unlockMember,
  toggleMemberStatus,
} from '../controllers/auditLogController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getAuditLogs);
router.get('/members', protect, getMembersList);
router.post('/members/:id/unlock', protect, unlockMember);
router.post('/members/:id/status', protect, toggleMemberStatus);

export default router;
