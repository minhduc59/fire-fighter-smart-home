const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

// Lấy thông tin thiết bị duy nhất
router.get('/', deviceController.getDevice);

// Cập nhật thông tin thiết bị
router.put('/', deviceController.updateDevice);

// Kiểm tra trạng thái thiết bị
router.get('/status', deviceController.getDeviceStatus);

// Reset tất cả điều khiển
router.post('/reset-controls', deviceController.resetControls);

module.exports = router;