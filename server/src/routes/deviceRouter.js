const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

// Lấy danh sách thiết bị
router.get('/', deviceController.getDevices);

// Lấy thông tin thiết bị cụ thể
router.get('/:deviceId', deviceController.getDevice);

module.exports = router;