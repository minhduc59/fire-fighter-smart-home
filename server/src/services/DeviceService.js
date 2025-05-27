const Device = require('../models/Device');

class DeviceService {
  // Đảm bảo chỉ có một document duy nhất trong collection
  static async getMainDevice() {
    try {
      let device = await Device.findOne();
      if (!device) {
        device = await Device.create({
          name: 'ESP8266 FireGuard',
          description: 'Fire monitoring and suppression system',
          location: 'Main Area',
          controls: {
            fan: false,
            door: false,
            fireSuppression: {
              bedroom: false,
              kitchen: false,
              all: false
            }
          }
        });
        console.log('Created new main device:', device);
      }
      return device;
    } catch (error) {
      console.error('Error getting main device:', error);
      throw error;
    }
  }

  // Cập nhật trạng thái thiết bị duy nhất
  static async updateStatus(status) {
    try {
      const device = await this.getMainDevice();
      device.status = status;
      device.lastSeen = new Date();
      await device.save();
      console.log(`Device status updated to: ${status}`);
      return device;
    } catch (error) {
      console.error('Error updating device status:', error);
      throw error;
    }
  }

  // Cập nhật điều khiển thiết bị
  static async updateControl(control, value, subControl = null) {
    try {
      const device = await this.getMainDevice();
      
      if (subControl) {
        // Xử lý điều khiển nested (fireSuppression)
        if (!device.controls[control]) {
          device.controls[control] = {};
        }
        device.controls[control][subControl] = value;
        
        // Logic đặc biệt cho hệ thống phun nước
        if (control === 'fireSuppression') {
          if (subControl === 'all') {
            // Nếu bật "all", tắt bedroom và kitchen
            if (value) {
              device.controls.fireSuppression.bedroom = false;
              device.controls.fireSuppression.kitchen = false;
            }
          } else {
            // Nếu bật bedroom hoặc kitchen, tắt "all"
            if (value) {
              device.controls.fireSuppression.all = false;
            }
          }
        }
      } else {
        // Xử lý điều khiển thông thường
        device.controls[control] = value;
      }
      
      device.lastSeen = new Date();
      await device.save();
      console.log(`Device control updated: ${control}${subControl ? `.${subControl}` : ''} = ${value}`);
      return device;
    } catch (error) {
      console.error('Error updating device control:', error);
      throw error;
    }
  }

  // Lấy thông tin đầy đủ của thiết bị
  static async getDeviceInfo() {
    try {
      const device = await this.getMainDevice();
      return {
        id: device._id,
        name: device.name,
        status: device.status,
        controls: device.controls,
        lastSeen: device.lastSeen,
        description: device.description,
        location: device.location,
        createdAt: device.createdAt,
        updatedAt: device.updatedAt
      };
    } catch (error) {
      console.error('Error getting device info:', error);
      throw error;
    }
  }

  // Reset tất cả điều khiển về false
  static async resetControls() {
    try {
      const device = await this.getMainDevice();
      device.controls = {
        fan: false,
        door: false,
        fireSuppression: {
          bedroom: false,
          kitchen: false,
          all: false
        }
      };
      device.lastSeen = new Date();
      await device.save();
      console.log('Device controls reset');
      return device;
    } catch (error) {
      console.error('Error resetting device controls:', error);
      throw error;
    }
  }

  // Kiểm tra thiết bị có online không
  static async isDeviceOnline() {
    try {
      const device = await this.getMainDevice();
      return device.status === 'online';
    } catch (error) {
      console.error('Error checking device online status:', error);
      return false;
    }
  }

  // Lấy thời gian kết nối cuối cùng
  static async getLastSeenTime() {
    try {
      const device = await this.getMainDevice();
      return device.lastSeen;
    } catch (error) {
      console.error('Error getting last seen time:', error);
      return null;
    }
  }
}

module.exports = DeviceService;