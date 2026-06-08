const express = require('express');
const router = express.Router();
const { getLogs, exportLogsCSV } = require('../controllers/logController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getLogs);
router.get('/export', protect, exportLogsCSV);

module.exports = router;
