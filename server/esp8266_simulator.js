// esp8266_simulator.js
const io = require('socket.io-client');
const socket = io('http://localhost:5000');

// Device ID
const deviceId = 'ESP-IOT-345';

// Connect to server
socket.on('connect', () => {
    console.log('Connected to server');
    
    // Đăng ký thiết bị
    socket.emit('device-connect', deviceId);
    
    // Gửi dữ liệu cảm biến định kỳ
    setInterval(() => {
        const data = {
            deviceId: deviceId,
            temperature: Math.random() * (100 - 20) + 20, // 20-40°C
            humidity: Math.random() * (80 - 40) + 40, // 40-80%
            gasLevel: Math.random() * (400 - 10) + 400 // 10-400 ppm
        };
        
        console.log('Sending data:', data);
        socket.emit('sensor-data', data);
    }, 10000);
});

// Nhận lệnh điều khiển từ server
socket.on('control', (command) => {
    console.log('Received control command:', command);
});

// Handle disconnect
socket.on('disconnect', () => {
    console.log('Disconnected from server');
});