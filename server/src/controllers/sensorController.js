const SensorData = require('../models/SensorData');

// Lấy dữ liệu lịch sử 
exports.getHistoricalData = async (req, res) => {
  try {
    const { from, to, type } = req.query;
    
    let query = {};
    
    // Thêm filter thời gian nếu có
    if (from && to) {
      query.timestamp = { 
        $gte: new Date(from), 
        $lte: new Date(to) 
      };
    }
    
    
    const data = await SensorData.find(query)
      .sort({ timestamp: 1 })
      .limit(1000); // Giới hạn để tránh quá tải
    
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

// Lấy dữ liệu thống kê
exports.getStatistics = async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    let startTime;
    switch(period) {
      case '1h':
        startTime = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }
    
    const data = await SensorData.find({
      timestamp: { $gte: startTime }
    });
    
    if (data.length === 0) {
      return res.json({
        success: true,
        statistics: null
      });
    }
    
    // Tính toán thống kê
    const temperatures = data.map(d => d.temperature);
    const humidities = data.map(d => d.humidity);
    const gasLevels = data.map(d => d.gasLevel);
    
    const statistics = {
      temperature: {
        min: Math.min(...temperatures),
        max: Math.max(...temperatures),
        avg: temperatures.reduce((a, b) => a + b) / temperatures.length
      },
      humidity: {
        min: Math.min(...humidities),
        max: Math.max(...humidities),
        avg: humidities.reduce((a, b) => a + b) / humidities.length
      },
      gasLevel: {
        min: Math.min(...gasLevels),
        max: Math.max(...gasLevels),
        avg: gasLevels.reduce((a, b) => a + b) / gasLevels.length
      },
      dataPoints: data.length,
      period: period,
      timeRange: {
        from: startTime,
        to: new Date()
      }
    };
    
    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error('Error calculating statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};