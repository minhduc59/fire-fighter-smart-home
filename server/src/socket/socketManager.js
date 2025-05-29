const DeviceService = require('../services/DeviceService');
const SensorData = require('../models/SensorData');

const setupSocketIO = (io) => {
  // Lưu trữ socket của ESP8266 duy nhất
  let esp8266Socket = null;

  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    // Xử lý ESP8266 kết nối
    socket.on('device-connect', async () => {
      console.log(`ESP8266 device connected with socket: ${socket.id}`);
      esp8266Socket = socket;

      try {
        // Cập nhật trạng thái thiết bị trong DB
        const device = await DeviceService.updateStatus('online');

        // Thông báo cho tất cả clients
        io.emit('device-status', {
          status: 'online',
          device: device
        });
      } catch (error) {
        console.error('Error updating device status:', error);
      }
    });

    // Nhận dữ liệu cảm biến từ ESP8266
    socket.on('sensor-data', async (data) => {
      console.log(`Received sensor data:`, data);

      try {
        // Lưu vào database
        const sensorData = new SensorData({
          temperature: data.temperature,
          humidity: data.humidity,
          gasLevel: data.gasLevel
        });
        await sensorData.save();

        // Cập nhật lastSeen của thiết bị
        await DeviceService.updateStatus('online');

        // Kiểm tra cảnh báo và áp dụng logic tự động
        const alerts = [];
        let autoActivation = null;

        // Định nghĩa ngưỡng
        const TEMP_THRESHOLD = 60;
        const GAS_THRESHOLD = 300;

        // Phân tích tình huống và xác định hành động
        if (data.temperature >= TEMP_THRESHOLD && data.gasLevel >= GAS_THRESHOLD) {
          // TRƯỜNG HỢP 1: Cả nhiệt độ và gas đều cao (Cháy nghiêm trọng)
          alerts.push({ type: 'temperature', value: data.temperature });
          alerts.push({ type: 'gas', value: data.gasLevel });

          autoActivation = {
            scenario: 'severe-fire',
            description: 'Cháy nghiêm trọng - Cả nhiệt độ và khí gas đều cao',
            actions: {
              door: true,                    // Mở cửa thoát hiểm
              fan: true,                     // Bật quạt thông gió
              fireSuppression: 'all'         // Phun nước cả 2 phòng
            }
          };

          console.log('🔥🔥 SEVERE FIRE DETECTED! Temp:', data.temperature, '°C, Gas:', data.gasLevel, 'ppm');

        } else if (data.temperature >= TEMP_THRESHOLD && data.gasLevel < GAS_THRESHOLD) {
          // TRƯỜNG HỢP 2: Chỉ nhiệt độ cao (Cháy ở phòng ngủ - ít khói)
          alerts.push({ type: 'temperature', value: data.temperature });

          autoActivation = {
            scenario: 'bedroom-fire',
            description: 'Cháy phòng ngủ - Nhiệt độ cao, ít khói',
            actions: {
              door: true,                    // Mở cửa thoát hiểm
              fan: true,                     // Bật quạt thông gió
              fireSuppression: 'bedroom'     // Phun nước phòng ngủ
            }
          };

          console.log('🔥 BEDROOM FIRE DETECTED! Temp:', data.temperature, '°C (Low gas level)');

        } else if (data.temperature < TEMP_THRESHOLD && data.gasLevel >= GAS_THRESHOLD) {
          // TRƯỜNG HỢP 3: Chỉ gas cao (Rò gas/cháy âm ỉ ở bếp)
          alerts.push({ type: 'gas', value: data.gasLevel });

          autoActivation = {
            scenario: 'kitchen-gas-leak',
            description: 'Rò gas hoặc cháy âm ỉ ở bếp - Khí gas cao, nhiệt độ thấp',
            actions: {
              door: true,                    // Mở cửa thông gió
              fan: true,                     // Bật quạt hút khí độc
              fireSuppression: 'kitchen'     // Phun nước phòng bếp
            }
          };

          console.log('💨 KITCHEN GAS LEAK DETECTED! Gas:', data.gasLevel, 'ppm (Normal temperature)');
        }

        // Thực thi hành động tự động nếu có
        if (autoActivation && esp8266Socket) {
          console.log(`🚨 AUTO-ACTIVATION: ${autoActivation.scenario.toUpperCase()}`);
          console.log(`📋 Description: ${autoActivation.description}`);
          console.log('🎯 Actions to execute:', autoActivation.actions);

          try {
            // Thực hiện các hành động theo thứ tự ưu tiên
            const actions = autoActivation.actions;

            // 1. MỞ CỬA (Ưu tiên cao nhất - thoát hiểm)
            if (actions.door) {
              await DeviceService.updateControl('door', true);
              esp8266Socket.emit('control', {
                control: 'door',
                value: true
              });
              console.log('🚪 Door OPENED for emergency exit');
            }

            // 2. BẬT QUẠT (Thông gió, hút khói)
            if (actions.fan) {
              await DeviceService.updateControl('fan', true);
              esp8266Socket.emit('control', {
                control: 'fan',
                value: true
              });
              console.log('🌪️ Fan ACTIVATED for ventilation');
            }

            // 3. KÍCH HOẠT HỆ THỐNG PHUN NƯỚC
            if (actions.fireSuppression) {
              await DeviceService.updateControl('fireSuppression', true, actions.fireSuppression);
              esp8266Socket.emit('control', {
                control: 'fireSuppression',
                subControl: actions.fireSuppression,
                value: true
              });

              const locationText = actions.fireSuppression === 'all' ? 'CẢ HAI PHÒNG' :
                actions.fireSuppression === 'bedroom' ? 'PHÒNG NGỦ' : 'PHÒNG BẾP';
              console.log(`🚿 Fire suppression system ACTIVATED: ${locationText}`);
            }

            // Thông báo cho frontend về tất cả thay đổi
            io.emit('control-update', {
              control: 'door',
              value: true
            });

            io.emit('control-update', {
              control: 'fan',
              value: true
            });

            io.emit('control-update', {
              control: 'fireSuppression',
              subControl: actions.fireSuppression,
              value: true
            });

            // Thêm thông báo tự động vào alerts
            alerts.push({
              type: 'auto-suppression',
              scenario: autoActivation.scenario,
              message: `🚨 KÍCH HOẠT TỰ ĐỘNG: ${autoActivation.description}`,
              actions: {
                door: '🚪 Mở cửa thoát hiểm',
                fan: '🌪️ Bật quạt thông gió',
                fireSuppression: `🚿 Phun nước ${actions.fireSuppression === 'all' ? 'cả hai phòng' :
                  actions.fireSuppression === 'bedroom' ? 'phòng ngủ' : 'phòng bếp'}`
              }
            });

          } catch (error) {
            console.error('❌ Error executing auto-activation:', error);
            alerts.push({
              type: 'system-error',
              message: 'Lỗi khi kích hoạt hệ thống tự động!'
            });
          }
        }

        // Gửi dữ liệu và cảnh báo cho frontend
        io.emit('data-update', {
          ...data,
          alerts,
          autoActivation,
          timestamp: new Date()
        });

        console.log("📡 Data sent to frontend", {
          ...data,
          alerts: alerts.length,
          autoActivation: autoActivation?.scenario || 'none',
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Error saving sensor data:', error);
      }
    });

    // Nhận lệnh điều khiển từ frontend
    socket.on('control-device', async (command) => {
      const { control, value, subControl } = command;
      console.log(`🎮 Manual control: ${control}${subControl ? `.${subControl}` : ''} = ${value}`);

      try {
        // Gửi lệnh trực tiếp đến ESP8266
        if (esp8266Socket) {
          esp8266Socket.emit('control', { control, value, subControl });

          // Cập nhật trạng thái điều khiển trong DB
          await DeviceService.updateControl(control, value, subControl);

          // Thông báo cập nhật điều khiển cho tất cả clients
          io.emit('control-update', { control, value, subControl });

          console.log(`✅ Manual control executed: ${control}${subControl ? `.${subControl}` : ''} = ${value}`);
        } else {
          console.log("❌ ESP8266 not connected - Cannot execute control");
        }
      } catch (error) {
        console.error('❌ Error handling control command:', error);
      }
    });

    // Xử lý ngắt kết nối
    socket.on('disconnect', async () => {
      // Kiểm tra nếu ESP8266 ngắt kết nối
      if (socket === esp8266Socket) {
        console.log(`📱 ESP8266 device disconnected`);
        esp8266Socket = null;

        try {
          // Cập nhật trạng thái trong DB
          await DeviceService.updateStatus('offline');

          // Thông báo cho tất cả clients
          io.emit('device-status', { status: 'offline' });
        } catch (error) {
          console.error('Error updating device status on disconnect:', error);
        }
      }
    });

    // Xử lý yêu cầu trạng thái thiết bị từ client
    socket.on('request-device-status', () => {
      console.log(`Client ${socket.id} requested device status`);

      // Gửi trạng thái hiện tại của thiết bị
      const deviceStatus = esp8266Socket ? 'online' : 'offline';
      socket.emit('device-status', {
        status: deviceStatus,
        timestamp: new Date()
      });

      console.log(`Sent device status to client: ${deviceStatus}`);
    });

    // Xử lý kết nối của web client
    socket.on('web-client-connect', () => {
      console.log(`Web client connected: ${socket.id}`);

      // Gửi trạng thái thiết bị ngay khi web client kết nối
      const deviceStatus = esp8266Socket ? 'online' : 'offline';
      socket.emit('device-status', {
        status: deviceStatus,
        timestamp: new Date()
      });

      console.log(`Sent device status to web client: ${deviceStatus}`);
    });
  });
};

module.exports = setupSocketIO;