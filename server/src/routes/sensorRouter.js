const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

// Lấy dữ liệu lịch sử
router.get('/history', sensorController.getHistoricalData);

module.exports = router;