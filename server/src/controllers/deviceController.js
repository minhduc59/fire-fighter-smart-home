const Device = require('../models/Device');

// Lấy danh sách thiết bị
exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.find();
    res.json({
      success: true,
      devices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Lấy thông tin thiết bị cụ thể
exports.getDevice = async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceId });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    
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