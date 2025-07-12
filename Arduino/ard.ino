#include <WiFi.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <ESP32Servo.h>

// WiFi Configuration
const char* ssid = "YOUR_WIF-SSID ";
const char* password = "YOUR_WIFI_PWD";

// Firebase Configuration
#define DATABASE_URL "YOUR_DB_URL"
#define API_KEY "YOUR_API_KEY"
#define USER_EMAIL "YOUR_ADMIN@YOURMAIL.COM"
#define USER_PASSWORD "YOUR_ADMIN_PASSWORD"

// Hardware Configuration
#define ONE_WIRE_BUS 25
#define IN1 12
#define IN2 14
#define IN3 26
#define IN4 27
#define SERVO_PIN 4

// Feeding Parameters
#define SERVO_OPEN_ANGLE 50
#define SERVO_CLOSE_ANGLE 0
#define SERVO_MOVE_DELAY 500
#define FOOD_DISPENSE_TIME 2000
#define STEPPER_STEPS 2048
#define STEPPER_DELAY 2000

// Global Objects
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
Servo foodGateServo;
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// System Variables
float currentTemp = 0.0;
String motorStatus = "idle";
unsigned long lastTempUpdate = 0;
const long tempUpdateInterval = 5000;
bool feedingEnabled = true;
bool servoEnabled = false;
bool tempSensorAvailable = true;
bool commandProcessing = false;

// Stepper Motor Sequence
const byte stepSequence[8][4] = {
  {1, 0, 0, 0},
  {1, 1, 0, 0},
  {0, 1, 0, 0},
  {0, 1, 1, 0},
  {0, 0, 1, 0},
  {0, 0, 1, 1},
  {0, 0, 0, 1},
  {1, 0, 0, 1}
};

void setupWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected with IP: " + WiFi.localIP().toString());
}

void initializeFirebase() {
  config.database_url = DATABASE_URL;
  config.api_key = API_KEY;
  config.token_status_callback = tokenStatusCallback;
  
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Firebase.reconnectWiFi(true);
  fbdo.setBSSLBufferSize(4096, 1024);
  fbdo.setResponseSize(2048);
  
  Serial.println("Initializing Firebase...");
  Firebase.begin(&config, &auth);
}

void updateMotorStatus() {
  if (Firebase.ready()) {
    String path = "/device/status/motor";
    if (!Firebase.RTDB.setString(&fbdo, path, motorStatus)) {
      Serial.println("Motor status update failed: " + fbdo.errorReason());
    }
  }
}

void rotateStepper(int steps, int stepDelay) {
  motorStatus = "rotating";
  updateMotorStatus();
  
  for (int i = 0; i < steps; i++) {
    for (int j = 0; j < 8; j++) {
      digitalWrite(IN1, stepSequence[j][0]);
      digitalWrite(IN2, stepSequence[j][1]);
      digitalWrite(IN3, stepSequence[j][2]);
      digitalWrite(IN4, stepSequence[j][3]);
      delayMicroseconds(stepDelay);
    }
  }
  
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
  
  motorStatus = "idle";
  updateMotorStatus();
}

void controlServo(bool open) {
  if (open) {
    foodGateServo.write(SERVO_OPEN_ANGLE);
    delay(SERVO_MOVE_DELAY);
  } else {
    foodGateServo.write(SERVO_CLOSE_ANGLE);
    delay(SERVO_MOVE_DELAY);
  }
}

void updateTemperature() {
  if (Firebase.ready() && tempSensorAvailable) {
    String path = "/device/sensors/temperature";
    if (Firebase.RTDB.setFloat(&fbdo, path, currentTemp)) {
      Serial.println("Temp updated: " + String(currentTemp));
    } else {
      Serial.println("Temp update failed: " + fbdo.errorReason());
    }
  }
}

void feedFish(bool scheduled = false, bool useServo = false) {
  if (!feedingEnabled) {
    Serial.println("Feeding is currently disabled in settings");
    return;
  }

  if (commandProcessing) {
    Serial.println("Already processing a command");
    return;
  }

  commandProcessing = true;
  
  if (Firebase.ready()) {
    Serial.println((scheduled ? "Scheduled" : "Manual") + String(" feeding started"));
    
    if (useServo && servoEnabled) {
      controlServo(true);
      delay(FOOD_DISPENSE_TIME);
      controlServo(false);
    } else {
      rotateStepper(STEPPER_STEPS, STEPPER_DELAY);
    }
    
    logFeedingEvent(scheduled ? "scheduled" : "manual", useServo);
  }
  
  commandProcessing = false;
}

void logFeedingEvent(String feedType, bool useServo) {
  if (Firebase.ready()) {
    FirebaseJson json;
    json.set("timestamp", millis() / 1000);
    json.set("type", feedType);
    json.set("status", "completed");
    json.set("method", useServo ? "servo" : "stepper");
    
    if (tempSensorAvailable) {
      json.set("temperature", currentTemp);
    }
    
    String path = "/feedingHistory";
    Firebase.RTDB.pushJSON(&fbdo, path, &json);
  }
}

void checkFirebaseCommands() {
  if (Firebase.ready() && !commandProcessing) {
    if (Firebase.RTDB.getJSON(&fbdo, "/device/commands/latest")) {
      FirebaseJson json = fbdo.to<FirebaseJson>();
      FirebaseJsonData result;
      
      if (json.get(result, "feed") && result.boolValue) {
        bool useServo = false;
        if (json.get(result, "servo") && result.boolValue) {
          useServo = true;
        }
        
        if (json.get(result, "status") && result.stringValue == "pending") {
          Serial.println("Feed command received (Servo: " + String(useServo ? "Yes" : "No") + ")");
          feedFish(false, useServo);
          
          json.set("status", "completed");
          json.set("completedAt", millis() / 1000);
          Firebase.RTDB.setJSON(&fbdo, "/device/commands/latest", &json);
        }
      }
    }
    
    if (Firebase.RTDB.getBool(&fbdo, "/device/settings/feedingEnabled")) {
      feedingEnabled = fbdo.boolData();
      Serial.println("Feeding enabled: " + String(feedingEnabled));
    }
    
    if (Firebase.RTDB.getBool(&fbdo, "/device/settings/servoEnabled")) {
      servoEnabled = fbdo.boolData();
      Serial.println("Servo enabled: " + String(servoEnabled));
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(5000);
  
  Serial.println("Starting Fish Feeder System");
  
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  
  foodGateServo.attach(SERVO_PIN);
  controlServo(false);
  
  sensors.begin();
  if (!sensors.getAddress(0, 0)) {
    Serial.println("No temperature sensor found!");
    tempSensorAvailable = false;
  }
  
  setupWiFi();
  initializeFirebase();
  
  Serial.println("Setup complete. Starting main loop.");
}

void loop() {
  if (millis() - lastTempUpdate >= tempUpdateInterval && tempSensorAvailable) {
    sensors.requestTemperatures();
    currentTemp = sensors.getTempCByIndex(0);
    
    if (currentTemp != DEVICE_DISCONNECTED_C) {
      Serial.println("Temperature: " + String(currentTemp) + "°C");
      updateTemperature();
    } else {
      Serial.println("Error reading temperature sensor");
    }
    lastTempUpdate = millis();
  }
  
  checkFirebaseCommands();
  delay(100);
}
