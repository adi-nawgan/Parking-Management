const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  searchPlate,
  recordVehicleEntry,
  recordVehicleExit
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/summary', protect, getDashboardSummary);
router.get('/search-plate', protect, searchPlate);
router.post('/entry', protect, recordVehicleEntry);
router.post('/exit', protect, recordVehicleExit);

module.exports = router;
