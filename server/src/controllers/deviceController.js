const DeviceService = require('../services/DeviceService');

// Lấy thông tin thiết bị duy nhất
exports.getDevice = async (req, res) => {
  try {
    const device = await DeviceService.getDeviceInfo();
    res.json({
      success: true,
      device
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Cập nhật thông tin thiết bị
exports.updateDevice = async (req, res) => {
  try {
    const { name, description, location } = req.body;
    const device = await DeviceService.updateDeviceInfo({
      name,
      description,
      location
    });
    
    res.json({
      success: true,
      device
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Kiểm tra trạng thái thiết bị
exports.getDeviceStatus = async (req, res) => {
  try {
    const isOnline = await DeviceService.isDeviceOnline();
    const lastSeen = await DeviceService.getLastSeenTime();
    
    res.json({
      success: true,
      status: isOnline ? 'online' : 'offline',
      lastSeen
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Reset tất cả điều khiển
exports.resetControls = async (req, res) => {
  try {
    const device = await DeviceService.resetControls();
    
    res.json({
      success: true,
      message: 'Controls reset successfully',
      device
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};