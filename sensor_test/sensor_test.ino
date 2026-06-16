// ─────────────────────────────────────────
//  ESP32 Water Control IoT System with HiveMQ
//  MQ sensor     → GPIO 33 (ADC1)
//  DS18B20       → GPIO 32 (1-Wire) + 4.7kΩ pull-up to 3.3V
//  Ultrasonic    → TRIG 19 / ECHO 18
//  pH Sensor     → GPIO 34 (ADC1)
//  Solenoid In   → GPIO 25 (Output via Relay/MOSFET)
//  Solenoid Out  → GPIO 26 (Output via Relay/MOSFET)
// ─────────────────────────────────────────
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#define MQ_PIN          33
#define TEMP_PIN        32
#define TRIG_PIN        19
#define ECHO_PIN        18
#define PH_PIN          34
#define SOLENOID_IN     25
#define SOLENOID_OUT    26

// ── WiFi & HiveMQ Configuration ───────────
const char* ssid          = "Emcc";
const char* password      = "ojotakokaku";

const char* mqtt_server   = "e8cbe8482ad84782a618ee7310d3d0d7.s1.eu.hivemq.cloud";
const int   mqtt_port     = 8883;
const char* mqtt_user     = "simogura";
const char* mqtt_password = "Simogura132";

// MQTT Topics
const char* topic_telemetry = "water_control/telemetry";
const char* topic_solenoid  = "water_control/valves";

WiFiClientSecure espClient;
PubSubClient client(espClient);

// 1-Wire bus & DS18B20 setup
OneWire           oneWire(TEMP_PIN);
DallasTemperature tempSensor(&oneWire);

unsigned long lastMsgTime = 0;
const long msgInterval = 5000; // Publish data every 5 seconds

// ── WiFi Setup ────────────────────────────
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// ── MQTT Reconnect ────────────────────────
void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Generate a unique client ID
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str(), mqtt_user, mqtt_password)) {
      Serial.println("connected!");
      // Re-subscribe to the valve command topic on reconnect
      client.subscribe(topic_solenoid);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" — retrying in 5 seconds");
      delay(5000);
    }
  }
}

// ── Ultrasonic Distance (HC-SR04) ─────────
float getDistance() {
  // Send a 10µs trigger pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Measure echo pulse width; timeout after 30 ms (~5 m max range)
  long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);

  if (duration == 0) {
    Serial.println("Ultrasonic: no echo / out of range");
    return -1.0;
  }

  // Convert to centimetres (sound speed ≈ 0.0343 cm/µs, round-trip ÷ 2)
  float distanceCm = (duration * 0.0343f) / 2.0f;
  return distanceCm;
}

// ── DS18B20 Temperature ───────────────────
float getTemperature() {
  tempSensor.requestTemperatures();
  float tempC = tempSensor.getTempCByIndex(0);
  return tempC;
}

// ── MQ Gas Sensor ─────────────────────────
int getMQRaw() {
  return analogRead(MQ_PIN);
}

// ── pH Sensor Voltage Return ──────────────
float getPHVoltage() {
  int rawAdc = analogRead(PH_PIN);
  // Returns raw voltage (0.0V–3.3V) based on ESP32 12-bit resolution
  float voltage = rawAdc * (3.3f / 4095.0f);
  return voltage;
}

// ── Ammonia Estimation (uncalibrated) ─────
float estimateAmmonia(float temp, float ph_voltage, int mqValue) {
  if (temp == DEVICE_DISCONNECTED_C) return -1.0f;
  // Placeholder mapping: relative indicator only — calibrate before production use
  float estimatedNh3 = (mqValue / 4095.0f) * (ph_voltage / 2.5f) * (temp / 25.0f);
  return estimatedNh3;
}

// ── Solenoid Valve Controls ───────────────
void controlSolenoidIn(bool openValve) {
  digitalWrite(SOLENOID_IN, openValve ? HIGH : LOW);
}

void controlSolenoidOut(bool openValve) {
  digitalWrite(SOLENOID_OUT, openValve ? HIGH : LOW);
}

// ─────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  while (!Serial) delay(10);

  // Sensor configuration
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(PH_PIN, INPUT);
  analogReadResolution(12);

  // Solenoid configuration
  pinMode(SOLENOID_IN, OUTPUT);
  pinMode(SOLENOID_OUT, OUTPUT);
  controlSolenoidIn(false);
  controlSolenoidOut(false);

  tempSensor.setResolution(9);
  tempSensor.begin();

  // Network initialization
  setup_wifi();
  espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);

  Serial.println("=== ESP32 Water IoT Configured ===");
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsgTime > msgInterval) {
    lastMsgTime = now;

    // 1. Gather Sensor Data
    float dist      = getDistance();
    float tempC     = getTemperature();
    int   mqRaw     = getMQRaw();
    float phVoltage = getPHVoltage();
    float ammonia   = estimateAmmonia(tempC, phVoltage, mqRaw);

    // 2. Control Logic
    String inValveStatus  = "CLOSED";
    String outValveStatus = "CLOSED";

    if (dist > 30.0f && dist != -1.0f) {
      controlSolenoidIn(true);
      controlSolenoidOut(false);
      inValveStatus = "OPEN";
    } else if (ammonia > 5.0f) {
      controlSolenoidIn(false);
      controlSolenoidOut(true);
      outValveStatus = "OPEN";
    } else {
      controlSolenoidIn(false);
      controlSolenoidOut(false);
    }

    // 3. Print Local Diagnostics
    Serial.println("── Local Telemetry ─────────");
    Serial.printf("Distance   : %.1f cm\n",  dist);
    Serial.printf("Temp       : %.1f °C\n",  tempC);
    Serial.printf("pH Voltage : %.3f V\n",   phVoltage);
    Serial.printf("MQ Raw     : %d\n",        mqRaw);
    Serial.printf("Ammonia Est: %.4f\n",      ammonia);
    Serial.printf("Valves     : IN [%s] | OUT [%s]\n",
                  inValveStatus.c_str(), outValveStatus.c_str());
    Serial.println("────────────────────────────");

    // 4. Construct and Publish MQTT Payloads
    String telemetryPayload = "{";
    telemetryPayload += "\"distance\":"    + String(dist,      1) + ",";
    telemetryPayload += "\"temperature\":" + String(tempC,     1) + ",";
    telemetryPayload += "\"ph_voltage\":"  + String(phVoltage, 3) + ",";
    telemetryPayload += "\"mq_raw\":"      + String(mqRaw)        + ",";
    telemetryPayload += "\"ammonia\":"     + String(ammonia,   4);
    telemetryPayload += "}";

    String valvePayload = "{\"solenoid_in\":\"" + inValveStatus +
                          "\",\"solenoid_out\":\"" + outValveStatus + "\"}";

    client.publish(topic_telemetry, telemetryPayload.c_str());
    client.publish(topic_solenoid,  valvePayload.c_str());
  }
}
