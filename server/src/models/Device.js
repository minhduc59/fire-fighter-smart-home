const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  controls: {
    pump: {
      type: Boolean,
      default: false
    },
    servo: {
      type: Boolean,
      default: false
    }
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Device', DeviceSchema);

// Chức năng xử lý thiết bị
// Cập nhật trạng thái thiết bị (online/offline) - Khi một thiết bị kết nối hoặc ngắt kết nối, trạng thái sẽ được cập nhật
// Điều khiển thiết bị - Bật/tắt bơm hoặc servo
// Theo dõi thời gian hoạt động cuối cùng - Cập nhật thời gian lastSeen khi thiết bị gửi dữ liệu