import { Router } from 'express';
const router = Router();
import {
  getResidents,
  getResidentById,
  createResident,
  updateResident,
  deleteResident,
} from '../controllers/residentController';
import { protect } from '../middleware/authMiddleware';

router.route('/')
  .get(protect, getResidents)
  .post(protect, createResident);

router.route('/:id')
  .get(protect, getResidentById)
  .put(protect, updateResident)
  .delete(protect, deleteResident);

export default router;
