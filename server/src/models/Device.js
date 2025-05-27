const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'ESP8266 FireGuard'
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  controls: {
    fan: {
      type: Boolean,
      default: false
    },
    door: {
      type: Boolean,
      default: false
    },
    fireSuppression:{
      bedroom: {
        type: Boolean,
        default: false
      },
      kitchen:{
        type: Boolean,
        default: false
      },
      all: {
        type: Boolean,
        default: false
      }
    }
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    default: 'Fire monitoring and suppression system'
  },
  location: {
    type: String,
    default: 'Main Area'
  }
}, {
  timestamps: true // Tự động thêm createdAt và updatedAt
});

module.exports = mongoose.model('Device', DeviceSchema);