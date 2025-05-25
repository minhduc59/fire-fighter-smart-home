require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const setupSocketIO = require('./socket/socketManager');

// Kết nối MongoDB
connectDB();

// Tạo HTTP server
const server = http.createServer(app);

// Thiết lập Socket.IO
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setupSocketIO(io);

// Khởi động server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});