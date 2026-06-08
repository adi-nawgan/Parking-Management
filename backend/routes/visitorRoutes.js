const express = require('express');
const router = express.Router();
const { getVisitorLogs } = require('../controllers/visitorController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getVisitorLogs);

module.exports = router;
