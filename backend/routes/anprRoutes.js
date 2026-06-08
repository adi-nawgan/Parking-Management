const express = require('express');
const router = express.Router();
const { processANPRDetection } = require('../controllers/anprController');

router.post('/plate-detected', processANPRDetection);

module.exports = router;
