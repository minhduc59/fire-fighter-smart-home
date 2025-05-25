const Device = require('../models/Device');
const SensorData = require('../models/SensorData');

const setupSocketIO = (io) => {
  // Lưu trữ kết nối của các thiết bị IoT
  const connectedDevices = {};
  
  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);
    
    // Xử lý thiết bị IoT kết nối
    socket.on('device-connect', async (deviceId) => {
      console.log(`Device connected: ${deviceId}`);
      connectedDevices[deviceId] = socket.id;
      
      // Cập nhật trạng thái thiết bị trong DB
      await Device.findOneAndUpdate(
        { deviceId },
        { status: 'online', lastSeen: Date.now() },
        { upsert: true }
      );
      
      // Thông báo cho tất cả clients
      io.emit('device-status', { deviceId, status: 'online' });
    });
    
    // Nhận dữ liệu cảm biến từ IoT
    socket.on('sensor-data', async (data) => {
      console.log(`Received sensor data:`, data);
      
      try {
        // Lưu vào database
        const sensorData = new SensorData({
          temperature: data.temperature,
          humidity: data.humidity,
          gasLevel: data.gasLevel,
          deviceId: data.deviceId
        });
        await sensorData.save();
        
        // Kiểm tra cảnh báo
        const alerts = [];
        if (data.temperature > 60){

         alerts.push({ type: 'temperature', value: data.temperature });
         console.log('Temperature alert:', data.temperature, "is Fire!!!! ");
         }
        if (data.gasLevel > 300) {
          alerts.push({ type: 'gas', value: data.gasLevel });
          console.log('Gas alert:', data.gasLevel, "is Fire!!!! ");
        }
        // Gửi dữ liệu và cảnh báo (nếu có) cho frontend
        io.emit('data-update', { ...data, alerts, timestamp: new Date() });
        console.log("Data sent to frontend", { ...data, alerts, timestamp: new Date() });
      } catch (error) {
        console.error('Error saving sensor data:', error);
      }
    });
    
    // Nhận lệnh điều khiển từ frontend
    socket.on('control-device', (command) => {
      const { deviceId, control, value } = command;
      console.log(`Control command: ${deviceId} - ${control} - ${value}`);
      
      // Chuyển tiếp lệnh tới thiết bị IoT
      const deviceSocketId = connectedDevices[deviceId];
      if(deviceSocketId){
        io.to(deviceSocketId).emit('control', { control, value });

        //Cập nhật trạng thái điều khiển trong DB
        Device.findOneAndUpdate(
          {deviceId},
          { [`controls.${control}`]: value }
        ).exec();
        console.log("Saved control command to DB");
      }
    });
    
    // Xử lý ngắt kết nối
    socket.on('disconnect', async () => {
      // Tìm thiết bị đã ngắt kết nối
      const deviceId = Object.keys(connectedDevices).find(
        key => connectedDevices[key] === socket.id
      );
      
      if (deviceId) {
        console.log(`Device disconnected: ${deviceId}`);
        delete connectedDevices[deviceId];
        
        // Cập nhật trạng thái trong DB
        await Device.findOneAndUpdate(
          { deviceId },
          { status: 'offline', lastSeen: Date.now() }
        );
        
        // Thông báo cho tất cả clients
        io.emit('device-status', { deviceId, status: 'offline' });
      }
    });
  });
};

module.exports = setupSocketIO;