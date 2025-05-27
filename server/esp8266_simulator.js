const io = require('socket.io-client');
const socket = io('http://localhost:5000');

// Connect to server
socket.on('connect', () => {
    console.log('ESP8266 Connected to server');
    
    // Đăng ký thiết bị
    socket.emit('device-connect');
    
    // Gửi dữ liệu cảm biến định kỳ
    setInterval(() => {
        const data = {
            // temperature: Math.random() * (100 - 20) + 20, // 20-100°C
            // humidity: Math.random() * (80 - 40) + 40, // 40-80%
            // gasLevel: Math.random() * (400 - 10) + 400 // 10-400 ppm
            temperature: 20,
            humidity: 40,
            gasLevel: 70 // 10-400 ppm
        };
        
        console.log('Sending sensor data:', data);
        socket.emit('sensor-data', data);
    }, 15000); // 5 giây
});

// Nhận lệnh điều khiển từ server
socket.on('control', (command) => {
    const { control, value, subControl } = command;
    
    if (subControl) {
        console.log(`Received control command: ${control}.${subControl} = ${value}`);
        
        // Xử lý điều khiển nested
        switch(control) {
            case 'fireSuppression':
                switch(subControl) {
                    case 'bedroom':
                        console.log(`Fire suppression system - Bedroom: ${value ? 'ACTIVATED' : 'DEACTIVATED'}`);
                        break;
                    case 'kitchen':
                        console.log(`Fire suppression system - Kitchen: ${value ? 'ACTIVATED' : 'DEACTIVATED'}`);
                        break;
                    case 'all':
                        console.log(`Fire suppression system - ALL ROOMS: ${value ? 'ACTIVATED' : 'DEACTIVATED'}`);
                        break;
                }
                break;
        }
    } else {
        console.log(`Received control command: ${control} = ${value}`);
        
        // Xử lý điều khiển thông thường
        switch(control) {
            case 'fan':
                console.log(`Fan: ${value ? 'ON' : 'OFF'}`);
                break;
            case 'door':
                console.log(`Door: ${value ? 'OPEN' : 'CLOSED'}`);
                break;
        }
    }
    
    // Mô phỏng phản hồi từ phần cứng
    console.log('Hardware control executed successfully');
});

// Handle disconnect
socket.on('disconnect', () => {
    console.log('ESP8266 disconnected from server');
});