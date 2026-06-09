import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { registerMember, loginMember, getMemberProfile, getParkingSummary, searchPlateOwner, createReport, getMyReports } from '../controllers/memberController';
import { protectMember } from '../middleware/memberAuth';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads/reports');
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
    }
  },
});

router.post('/register', registerMember);
router.post('/login', loginMember);
router.get('/profile', protectMember, getMemberProfile);
router.get('/parking-summary', protectMember, getParkingSummary);
router.get('/search-plate', protectMember, searchPlateOwner);
router.get('/reports', protectMember, getMyReports);
router.post('/reports', protectMember, upload.single('photo'), createReport);

export default router;
