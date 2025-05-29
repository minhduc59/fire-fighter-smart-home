# Hệ Thống Nhà Thông Minh Chống Cháy - Hướng Dẫn Cài Đặt

Một hệ thống phát hiện và dập cháy thông minh được xây dựng bằng **ESP8266**, **Node.js**, **React** và **MongoDB**.

# 🔥 Tổng Quan

Dự án này phát hiện nguy cơ cháy bằng cảm biến khí gas và nhiệt độ, và tự động kích hoạt các cơ chế an toàn như hệ thống phun nước và quạt thông gió. Hệ thống cũng bao gồm giao diện React để giám sát thời gian thực và điều khiển thủ công.

# 📦 Các Thành Phần Hệ Thống

- **ESP8266 NodeMCU**: Giám sát cảm biến và điều khiển thiết bị
- **Máy chủ Node.js**: Xử lý dữ liệu cảm biến và đưa ra phản ứng
- **Giao diện React**: Hiển thị dữ liệu và điều khiển hệ thống
- **MongoDB**: Lưu trữ dữ liệu lịch sử

# 🔧 Yêu Cầu Phần Cứng

- ESP8266 NodeMCU  
- Cảm biến DHT22 (nhiệt độ & độ ẩm)  
- Cảm biến khí gas MQ2  
- 2 Động cơ servo (điều khiển cửa & hướng vòi phun)  
- 2 Relay module (điều khiển quạt & máy bơm)  
- Màn hình LCD I2C 16x2  
- Dây nối, breadboard  
- Nguồn điện 5V  

# 🖥️ Sơ Đồ Kết Nối

- D2 / GPIO2  → DHT22  
- D5 / GPIO14 → Servo 1 (Cửa)  
- D6 / GPIO12 → Servo 2 (Vòi phun)  
- D7 / GPIO13 → Relay 1 (Máy bơm nước)  
- D8 / GPIO15 → Relay 2 (Quạt)  
- A0         → MQ2  
- D1 / GPIO5 → LCD SCL  
- D2 / GPIO4 → LCD SDA  

# ⚙️ Cài Đặt & Thiết Lập

## 1. ESP8266

- Cài đặt Arduino IDE  
- Thêm board ESP8266 trong Board Manager  
- Cài các thư viện sau:

```
ESP8266WiFi  
WebSocketsClient  
SocketIOclient  
ArduinoJson  
Servo  
DHT  
Wire  
LiquidCrystal_I2C  
```

- Mở file `ESP.ino` và cấu hình WiFi và địa chỉ IP máy chủ:

```cpp
const char* ssid = "your-wifi-ssid";  
const char* password = "your-wifi-password";  
const char* serverIP = "your-server-ip";  
```

- Nạp chương trình vào ESP8266

## 2. MongoDB

- Tải tại: https://www.mongodb.com/try/download/community  
- Khởi động:

```bash
mongod --dbpath /đường/dẫn/tới/thư_mục_data
```

## 3. Máy chủ Node.js

```bash
cd server
npm install
```

- Cấu hình `.env`:

```
PORT=5000  
MONGO_URI=mongodb://localhost:27017/iot_monitoring  
```

- Chạy server:

```bash
npm run start
```

- Phát triển với hot reload:

```bash
npm run dev
```

## 4. Giao Diện React

```bash
cd client
npm install
```

- Cấu hình `.env`:

```
REACT_APP_SOCKET_URL=http://localhost:5000  
REACT_APP_API_URL=http://localhost:5000/api  
```

- Chạy giao diện:

```bash
npm start
```

# 🧪 Kiểm Tra Hệ Thống

## Mô Phỏng ESP8266

Nếu không có phần cứng:

```bash
cd server  
node esp8266_simulator.js  
```

## Tình Huống Giả Lập Cháy

- **Nhiệt độ cao + khí gas cao** → cháy toàn diện  
- **Chỉ nhiệt độ cao** → có thể cháy phòng ngủ  
- **Chỉ khí gas cao** → có thể rò rỉ khí gas trong bếp  

# 👨‍💻 Hướng Dẫn Sử Dụng

## Bảng Điều Khiển Chính

- Hiển thị nhiệt độ, độ ẩm, gas hiện tại  
- Biểu đồ thời gian thực  
- Nút điều khiển quạt, cửa, chữa cháy  
- Cảnh báo nguy hiểm  

## Điều Khiển Thủ Công

- **Quạt**: Bật thông gió  
- **Cửa**: Mở lối thoát  
- **Chữa cháy**: Phun nước theo khu vực  

## Lịch Sử Dữ Liệu

- Xem lại dữ liệu cảm biến theo loại: nhiệt độ, độ ẩm, khí gas  
- Lọc theo thời gian  

# 🚨 Phản Ứng Khi Gặp Sự Cố

- ESP8266 phản ứng cục bộ ngay lập tức  
- Gửi dữ liệu kèm cờ khẩn cấp về máy chủ  
- Máy chủ xử lý và ra quyết định phản ứng  
- Giao diện web hiển thị cảnh báo & trạng thái thiết bị  

# 🛠️ Khắc Phục Sự Cố

## ESP8266

- Kiểm tra thông tin WiFi  
- Kiểm tra địa chỉ IP máy chủ  
- Mở Serial Monitor để xem log  

## Máy chủ

- Kiểm tra MongoDB đã chạy  
- Xem log lỗi  
- Kiểm tra tường lửa chặn cổng  

## Giao diện React

- Kiểm tra file `.env` đúng URL  
- Mở DevTools → Console để xem lỗi