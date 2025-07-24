
# 🔥 Smart Fire Safety Home System – Installation Guide

An intelligent fire detection and suppression system built using **ESP8266**, **Node.js**, **React**, and **MongoDB**.

## 🔍 Overview

This project detects fire hazards through gas and temperature sensors and automatically activates safety mechanisms such as water pumps and ventilation fans. It also includes a React-based interface for real-time monitoring and manual control.

## 📦 System Components

- **ESP8266 NodeMCU**: Monitors sensors and controls devices  
- **Node.js Server**: Handles sensor data and system responses  
- **React Interface**: Displays real-time data and allows control  
- **MongoDB**: Stores historical sensor data

## 🔧 Hardware Requirements

- ESP8266 NodeMCU  
- DHT22 sensor (temperature & humidity)  
- MQ2 gas sensor  
- 2 Servo motors (for door & nozzle control)  
- 2 Relay modules (for fan & water pump control)  
- 16x2 I2C LCD display  
- Jumper wires, breadboard  
- 5V power supply  

## 🖥️ Wiring Diagram

- D2 / GPIO2  → DHT22  
- D5 / GPIO14 → Servo 1 (Door)  
- D6 / GPIO12 → Servo 2 (Nozzle)  
- D7 / GPIO13 → Relay 1 (Water pump)  
- D8 / GPIO15 → Relay 2 (Fan)  
- A0         → MQ2  
- D1 / GPIO5 → LCD SCL  
- D2 / GPIO4 → LCD SDA  

## ⚙️ Installation & Setup

### 1. ESP8266

- Install **Arduino IDE**  
- Add the **ESP8266 board** via Board Manager  
- Install the following libraries:

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

- Open `ESP.ino` and configure WiFi and server IP:

```cpp
const char* ssid = "your-wifi-ssid";  
const char* password = "your-wifi-password";  
const char* serverIP = "your-server-ip";  
```

- Upload the code to the ESP8266

### 2. MongoDB

- Download: https://www.mongodb.com/try/download/community  
- Start the database:

```bash
mongod --dbpath /path/to/your/data_folder
```

### 3. Node.js Server

```bash
cd server
npm install
```

- Create a `.env` file:

```
PORT=5000  
MONGO_URI=mongodb://localhost:27017/iot_monitoring  
```

- Start the server:

```bash
npm run start
```

- For development with hot reload:

```bash
npm run dev
```

### 4. React Client

```bash
cd client
npm install
```

- Create a `.env` file:

```
REACT_APP_SOCKET_URL=http://localhost:5000  
REACT_APP_API_URL=http://localhost:5000/api  
```

- Run the React app:

```bash
npm start
```

## 🧪 System Testing

### Simulate ESP8266

If no hardware is available:

```bash
cd server  
node esp8266_simulator.js  
```

### Simulated Fire Scenarios

- **High temperature + high gas** → full fire alert  
- **High temperature only** → possible bedroom fire  
- **High gas only** → possible gas leak in kitchen  

## 👨‍💻 User Guide

### Main Dashboard

- Displays current temperature, humidity, and gas levels  
- Real-time chart updates  
- Control buttons for fan, door, and fire suppression  
- Hazard alerts  

### Manual Controls

- **Fan**: Activate ventilation  
- **Door**: Open escape path  
- **Fire Suppression**: Activate water pump by zone  

### Historical Data

- View past sensor data by type: temperature, humidity, gas  
- Filter by time range  

## 🚨 Emergency Response Workflow

- ESP8266 reacts immediately to hazards locally  
- Sends data and emergency flags to the server  
- Server processes and decides on response actions  
- Web interface displays real-time alerts and device status  

## 🛠️ Troubleshooting

### ESP8266

- Check WiFi credentials  
- Verify server IP  
- Open Serial Monitor to view logs  

### Server

- Ensure MongoDB is running  
- Check error logs  
- Verify firewall isn’t blocking the port  

### React Interface

- Ensure `.env` contains correct URLs  
- Open DevTools → Console to check for errors  
