import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { registerMember, loginMember, getMemberProfile, getParkingSummary, searchPlateOwner, createReport, getMyReports } from '../controllers/memberController';
import { protectMember } from '../middleware/memberAuth';
import { protect } from '../middleware/authMiddleware';
import { lookupLimiter } from '../middleware/rateLimiter';

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png'];
    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    
    const fileExt = path.extname(file.originalname).toLowerCase();
    const isExtAllowed = allowedExts.includes(fileExt);
    const isMimeAllowed = allowedMimeTypes.includes(file.mimetype);
    
    if (isExtAllowed && isMimeAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Complaint photo upload must only accept JPG and PNG file types'));
    }
  },
});

const uploadPhotoEvidence = (req: Request, res: Response, next: NextFunction) => {
  const uploadSingle = upload.single('photo');
  
  uploadSingle(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'Complaint photo exceeds maximum 5MB size limit' });
        }
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Member management under admin protection
router.post('/register', protect, registerMember);

// Public member routes
router.post('/login', loginMember);
router.get('/profile', protectMember, getMemberProfile);
router.get('/parking-summary', protectMember, getParkingSummary);

// Plate lookup with member auth and rate limiter
router.get('/search-plate', protectMember, lookupLimiter, searchPlateOwner);

// Report routes
router.get('/reports', protectMember, getMyReports);
router.post('/reports', protectMember, uploadPhotoEvidence, createReport);

export default router;
