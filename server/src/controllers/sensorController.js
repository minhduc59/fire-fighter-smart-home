const SensorData = require('../models/SensorData');

// Lấy dữ liệu lịch sử
exports.getHistoricalData = async (req, res) => {
  try {
    const { deviceId, from, to, type } = req.query;
    
    const query = { deviceId };
    
    // Thêm filter thời gian nếu có
    if (from && to) {
      query.timestamp = { 
        $gte: new Date(from), 
        $lte: new Date(to) 
      };
    }
    
    // Lấy dữ liệu từ MongoDB
    const data = await SensorData.find(query).sort({ timestamp: 1 });
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};