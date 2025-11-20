#include <Wire.h>
#include <SPI.h>
#include <ArduCAM.h>
#include <memorysaver.h>

// Chip select pin for the ArduCAM SPI interface.
const int CS_PIN = 10;

// Create the camera object for the OV2640 module.
ArduCAM camera(OV2640, CS_PIN);

// Simple ASCII markers that the host script can look for.
const char *kHeaderStart = "IMG-START";
const char *kHeaderDone = "IMG-DONE";

void setup() {
  uint8_t vid, pid;

  pinMode(CS_PIN, OUTPUT);
  digitalWrite(CS_PIN, HIGH);

  Wire.begin();
  SPI.begin();
  // Set up a 4 MHz SPI clock in a way that works across core versions.
  SPI.beginTransaction(SPISettings(4000000, MSBFIRST, SPI_MODE0));

  Serial.begin(921600);
  while (!Serial) {
    ;
  }

  // Make sure the correct sensor definition is enabled in memorysaver.h.
  camera.write_reg(0x07, 0x80);
  delay(100);
  camera.write_reg(0x07, 0x00);
  delay(100);

  camera.set_format(JPEG);
  camera.InitCAM();

  // Read the camera ID to verify wiring and configuration.
  camera.wrSensorReg8_8(0xff, 0x01);
  camera.rdSensorReg8_8(OV2640_CHIPID_HIGH, &vid);
  camera.rdSensorReg8_8(OV2640_CHIPID_LOW, &pid);

  // Default to VGA to keep file sizes modest for the UNO.
  camera.OV2640_set_JPEG_size(OV2640_640x480);

  Serial.println(F("OV2640 ready. Send 'c' over serial to capture a frame."));
  Serial.print(F("Sensor ID: 0x"));
  Serial.print(vid, HEX);
  Serial.print(F(" 0x"));
  Serial.println(pid, HEX);
}

void loop() {
  if (Serial.available()) {
    char cmd = Serial.read();
    if (cmd == 'c' || cmd == 'C') {
      captureAndSend();
    }
  }
}

void captureAndSend() {
  camera.flush_fifo();
  camera.clear_fifo_flag();
  camera.start_capture();

  // Wait for capture to complete.
  while (!camera.get_bit(ARDUCHIP_TRIG, CAP_DONE_MASK)) {
    // Busy wait; capture is quick in JPEG mode.
  }

  uint32_t length = camera.read_fifo_length();
  if (length == 0 || length >= 0x7FFFFF) {
    Serial.println(F("Capture failed: invalid length"));
    return;
  }

  Serial.println(kHeaderStart);
  Serial.println(length);

  digitalWrite(CS_PIN, LOW);
  camera.set_fifo_burst();

  // Stream the JPEG bytes directly to the host.
  for (uint32_t i = 0; i < length; i++) {
    uint8_t byte = SPI.transfer(0x00);
    Serial.write(byte);
  }

  digitalWrite(CS_PIN, HIGH);
  camera.clear_fifo_flag();

  Serial.println();
  Serial.println(kHeaderDone);
}
