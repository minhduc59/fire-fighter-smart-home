#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <WebSocketsClient.h>
#include <SocketIOclient.h>
#include <ArduinoJson.h>
#include <Servo.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// Thông tin WiFi
const char* ssid = "PT";
const char* password = "123456789@";

// Địa chỉ máy chủ Socket.IO
const char* serverIP = "192.168.81.139";
const uint16_t serverPort = 5000;

// Cấu hình chân
#define DHTPIN 2       // D4 trên NodeMCU = GPIO2
#define DHTTYPE DHT22  // Loại cảm biến DHT22
#define RELAY1_PIN 13  // D7 - GPIO13 (bơm phòng ngủ)
#define RELAY2_PIN 15  // D8 - GPIO15 (quạt)
#define MQ2_PIN A0     // Cảm biến gas MQ2

// Khởi tạo đối tượng
DHT dht(DHTPIN, DHTTYPE);
Servo servo1;  // D5 - GPIO14 (cửa)
Servo servo2;  // D6 - GPIO12 (bơm phòng bếp)
ESP8266WiFiMulti wifiMulti;
SocketIOclient socketIO;
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Biến toàn cục
float temperature = 0, humidity = 0;
int gasValue = 0;
bool isConnected = false;

// Biến trạng thái cho hệ thống phun nước "all"
bool isFireSuppressionAllActive = false;
unsigned long fireSuppressionStartTime = 0;
bool servoToggle = true;
unsigned long lastServoToggleTime = 0;

unsigned long lastSensorRead = 0;
unsigned long lastDataSend = 0;
unsigned long lastReconnectAttempt = 0;
unsigned long lastHeapCheck = 0;
unsigned long lastLCDUpdate = 0;

void checkEmergencyConditions() {
  const float TEMP_THRESHOLD = 60.0;
  const int GAS_THRESHOLD = 300;
  bool tempAlert = temperature >= TEMP_THRESHOLD;
  bool gasAlert = gasValue >= GAS_THRESHOLD;
  
  if (tempAlert || gasAlert) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("!!! ALERT !!!");
    lcd.setCursor(0, 1);
    if (tempAlert && gasAlert)
      lcd.print("FIRE DETECTED!");
    else if (tempAlert)
      lcd.print("HIGH TEMP ALERT!");
    else
      lcd.print("GAS LEAK ALERT!");
  }
  
  if (tempAlert || gasAlert) {
    servo1.write(0);
    DynamicJsonDocument doc(512);
    JsonArray array = doc.to<JsonArray>();
    array.add("sensor-data");
    JsonObject sensorData = array.createNestedObject();
    sensorData["temperature"] = temperature;
    sensorData["humidity"] = humidity;
    sensorData["gasLevel"] = gasValue;
    sensorData["emergency"] = true;
    sensorData["tempAlert"] = tempAlert;
    sensorData["gasAlert"] = gasAlert;

    digitalWrite(RELAY2_PIN, HIGH);
    digitalWrite(RELAY1_PIN, HIGH);
    if (tempAlert && gasAlert) {
      servo1.write(0);
      // Bật chế độ phun nước "all" tự động
      startFireSuppressionAll();
    } else if (tempAlert) {
      servo2.write(180);
    } else if (gasAlert) {
      servo2.write(60);
    }

    String output;
    serializeJson(doc, output);
    socketIO.sendEVENT(output);
    
    Serial.println("EMERGENCY DATA SENT IMMEDIATELY");
  }
}

// Hàm bắt đầu chế độ phun nước "all"
void startFireSuppressionAll() {
  isFireSuppressionAllActive = true;
  fireSuppressionStartTime = millis();
  lastServoToggleTime = millis();
  servoToggle = true;
  digitalWrite(RELAY1_PIN, HIGH);
  servo2.write(180); // Bắt đầu với phòng ngủ
  Serial.println("Đã BẬT hệ thống phun nước TẤT CẢ");
  Serial.println("Phun nước phòng ngủ (180°)");
}

// Hàm dừng chế độ phun nước "all"
void stopFireSuppressionAll() {
  isFireSuppressionAllActive = false;
  digitalWrite(RELAY1_PIN, LOW);
  servo2.write(120); // Về vị trí trung gian
  Serial.println("TẮT hệ thống phun nước TẤT CẢ");
}

// Hàm xử lý chế độ phun nước "all" trong loop
void handleFireSuppressionAll() {
  if (!isFireSuppressionAllActive) return;
  unsigned long currentTime = millis();
  // Chuyển đổi servo mỗi 1 giây
  if (currentTime - lastServoToggleTime >= 1000) {
    servoToggle = !servoToggle;
    if (servoToggle) {
      servo2.write(180);
      Serial.println("Phun nước phòng ngủ (180°)");
    } else {
      servo2.write(60);
      Serial.println("Phun nước phòng bếp (60°)");
    }
    lastServoToggleTime = currentTime;
  }
}

void updateLCD() {
  // Nếu đang trong chế độ phun nước "all", hiển thị thông tin đặc biệt
  if (isFireSuppressionAllActive) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("FIRE SUPPRESS ON");
    lcd.setCursor(0, 1);
    if (servoToggle) {
      lcd.print("-> BEDROOM");
    } else {
      lcd.print("-> KITCHEN");
    }
    return;
  }
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("T:");
  lcd.print(temperature, 1);
  lcd.print("C H:");
  lcd.print(humidity, 1);
  lcd.print("%");
  
  lcd.setCursor(0, 1);
  lcd.print("Gas:");
  lcd.print(gasValue);
}

String serialized(const String& msg) {
  return String(msg);
}

void sendDeviceConnectEvent() {
  DynamicJsonDocument doc(512);
  JsonArray array = doc.to<JsonArray>();
  array.add("device-connect");
  array.add(serialized("{}"));
  
  String output;
  serializeJson(doc, output);
  socketIO.sendEVENT(output);
  Serial.println("[IOc] Đã gửi sự kiện device-connect");
  isConnected = true;
}

void handleSocketEvent(uint8_t * payload, size_t length) {
  DynamicJsonDocument doc(512);
  DeserializationError error = deserializeJson(doc, payload, length);
  
  if (error) {
    Serial.print("deserializeJson() failed: ");
    Serial.println(error.c_str());
    return;
  }
  
  String eventName = doc[0];
  Serial.print("Nhận sự kiện: ");
  Serial.println(eventName);
  
  if (eventName == "control") {
    JsonObject data = doc[1];
    String control = data["control"];
    bool value = data["value"];
    
    Serial.print("Lệnh điều khiển: ");
    Serial.print(control);
    Serial.print(" -> ");
    Serial.println(value ? "BẬT" : "TẮT");
    
    if (control == "fan") {
      digitalWrite(RELAY2_PIN, value ? HIGH : LOW);
      Serial.println(value ? "Đã BẬT quạt" : "Đã TẮT quạt");
    } 
    else if (control == "door") {
      servo1.write(value ? 0 : 90);
      Serial.println(value ? "Đã MỞ cửa" : "Đã ĐÓNG cửa");
    }
    else if (control == "fireSuppression") {
      String subControl = data["subControl"];
      
      if (subControl == "bedroom") {
        digitalWrite(RELAY1_PIN, value ? HIGH : LOW);
        servo2.write(value ? 180 : 120);
        Serial.println(value ? "Đã BẬT hệ thống phun nước phòng ngủ" : "Đã TẮT hệ thống phun nước phòng ngủ");
      }
      else if (subControl == "kitchen") {
        servo2.write(value ? 60 : 120);
        digitalWrite(RELAY1_PIN, value ? HIGH : LOW);
        Serial.println(value ? "Đã BẬT hệ thống phun nước phòng bếp" : "Đã TẮT hệ thống phun nước phòng bếp");
      }
      else if (subControl == "all") {
        if (value) {
          startFireSuppressionAll();
        } else {
          stopFireSuppressionAll();
        }
      }
    }
  }
}

void socketIOEvent(socketIOmessageType_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case sIOtype_DISCONNECT:
      Serial.println("[IOc] Ngắt kết nối");
      isConnected = false;
      break;
      
    case sIOtype_CONNECT:
      Serial.println("[IOc] Đã kết nối với server");
      socketIO.send(sIOtype_CONNECT, "/");
      sendDeviceConnectEvent();
      break;
      
    case sIOtype_EVENT:
      handleSocketEvent(payload, length);
      break;
      
    case sIOtype_ACK:
      Serial.println("[IOc] Nhận ACK");
      break;
      
    case sIOtype_ERROR:
      Serial.println("[IOc] Lỗi kết nối");
      isConnected = false;
      break;
      
    case sIOtype_BINARY_EVENT:
      Serial.println("[IOc] Nhận binary event");
      break;
      
    case sIOtype_BINARY_ACK:
      Serial.println("[IOc] Nhận binary ack");
      break;
  }
}

void sendSensorData() {
  if (!isConnected) {
    Serial.println("Không gửi dữ liệu - Chưa kết nối đến server");
    return;
  }
  
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Lỗi đọc cảm biến DHT!");
    return;
  }
  
  DynamicJsonDocument doc(512);
  JsonArray array = doc.to<JsonArray>();
  
  array.add("sensor-data");
  
  JsonObject sensorData = array.createNestedObject();
  sensorData["temperature"] = temperature;
  sensorData["humidity"] = humidity;
  sensorData["gasLevel"] = gasValue;
  
  String output;
  serializeJson(doc, output);
  
  Serial.print("Kích thước dữ liệu (bytes): ");
  Serial.println(output.length());
  
  socketIO.sendEVENT(output);
  
  Serial.print("Đã gửi dữ liệu: Nhiệt độ: ");
  Serial.print(temperature);
  Serial.print("°C, Độ ẩm: ");
  Serial.print(humidity);
  Serial.print("%, Khí gas: ");
  Serial.println(gasValue);
}

void checkConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi mất kết nối, đang kết nối lại...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    
    unsigned long startAttempt = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 10000) {
      delay(500);
      Serial.print(".");
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nĐã kết nối lại WiFi!");
      Serial.print("IP: ");
      Serial.println(WiFi.localIP());
    } else {
      Serial.println("\nKhông thể kết nối lại WiFi!");
      return;
    }
  }
  
  if (!isConnected && millis() - lastReconnectAttempt > 5000) {
    lastReconnectAttempt = millis();
    Serial.println("Thử kết nối lại Socket.IO...");
    socketIO.disconnect();
    socketIO.begin(serverIP, serverPort);
  }
}

void readSensors() {
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  gasValue = analogRead(MQ2_PIN);
  
  if (!isnan(temperature) && !isnan(humidity)) {
    Serial.print("Độ ẩm: ");
    Serial.print(humidity);
    Serial.print(" %, Nhiệt độ: ");
    Serial.print(temperature);
    Serial.println(" °C");
  } else {
    Serial.println("Lỗi khi đọc cảm biến DHT22!");
  }
  
  Serial.print("MQ2 analog: ");
  Serial.println(gasValue);
}

void setup() {
  Serial.begin(115200);
  
  Wire.begin();
  lcd.begin(16, 2);
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Initializing...");
  
  dht.begin();
  
  servo1.attach(14);
  servo2.attach(12);
  
  pinMode(RELAY1_PIN, OUTPUT);
  digitalWrite(RELAY1_PIN, LOW);
  
  pinMode(RELAY2_PIN, OUTPUT);
  digitalWrite(RELAY2_PIN, LOW);
  
  servo1.write(90);
  servo2.write(60);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  Serial.print("Đang kết nối WiFi");
  lcd.setCursor(0, 1);
  lcd.print("Connecting WiFi");
  
  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 20000) {
    delay(500);
    Serial.print(".");
    lcd.print(".");
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nĐã kết nối WiFi!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected!");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
  } else {
    Serial.println("\nKhông thể kết nối WiFi, thử lại...");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Failed!");
    ESP.restart();
    return;
  }

  socketIO.begin(serverIP, serverPort);
  socketIO.onEvent(socketIOEvent);
  socketIO.setReconnectInterval(5000);
  
  Serial.println("ESP8266 khởi động hoàn tất");
  Serial.print("Bộ nhớ trống: ");
  Serial.println(ESP.getFreeHeap());
  
  delay(2000);
  updateLCD();
}

void loop() {
  unsigned long currentMillis = millis();
  static unsigned long lastSocketLoop = 0;

  // Xử lý chế độ phun nước "all" nếu đang hoạt động
  handleFireSuppressionAll();

  if (currentMillis - lastSensorRead > 2000) {
    readSensors();
    checkEmergencyConditions();
    lastSensorRead = currentMillis;
  }
  
  if (currentMillis - lastSocketLoop > 50) {
    socketIO.loop();
    lastSocketLoop = currentMillis;
  }
  
  if (currentMillis - lastReconnectAttempt > 10000) {
    checkConnection();
    lastReconnectAttempt = currentMillis;
  }
  
  if (currentMillis - lastDataSend > 15000 && isConnected) {
    sendSensorData();
    lastDataSend = currentMillis;
  }
  
  if (currentMillis - lastLCDUpdate > 5000) {
    updateLCD();
    lastLCDUpdate = currentMillis;
  }
  
  if (currentMillis - lastHeapCheck > 30000) {
    Serial.print("Bộ nhớ trống: ");
    Serial.println(ESP.getFreeHeap());
    lastHeapCheck = currentMillis;
  }
  
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    Serial.print("Lệnh nhận được: ");
    Serial.println(cmd);

    if (cmd == "SERVO1_0") {
      servo1.write(0);
    } else if (cmd == "SERVO1_90") {
      servo1.write(90);
    } else if (cmd == "SERVO2_60") {
      servo2.write(60);
    } else if (cmd == "SERVO2_180") {
      servo2.write(180);
    } else if (cmd == "RELAY_ON") {
      digitalWrite(RELAY1_PIN, HIGH);
    } else if (cmd == "RELAY_OFF") {
      digitalWrite(RELAY1_PIN, LOW);
    } else if (cmd == "RELAY2_ON") {
      digitalWrite(RELAY2_PIN, HIGH);
    } else if (cmd == "RELAY2_OFF") {
      digitalWrite(RELAY2_PIN, LOW);
    } else if (cmd == "FIRE_ALL_START") {
      startFireSuppressionAll();
    } else if (cmd == "FIRE_ALL_STOP") {
      stopFireSuppressionAll();
    }
  }
  
  delay(10);
}