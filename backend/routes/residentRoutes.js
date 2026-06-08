const express = require('express');
const router = express.Router();
const {
  getResidents,
  getResidentById,
  createResident,
  updateResident,
  deleteResident
} = require('../controllers/residentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getResidents)
  .post(protect, createResident);

router.route('/:id')
  .get(protect, getResidentById)
  .put(protect, updateResident)
  .delete(protect, deleteResident);

module.exports = router;
