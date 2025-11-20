# Test-for-Chatgpt-coding

This repository contains an Arduino sketch and a small Python helper script to capture a JPEG frame from an Arducam OV2640 Mini 2MP camera attached to an Arduino Uno R3 and save it to your PC.

## Wiring overview
- CS (camera) → pin 10 on the Uno
- MOSI → pin 11
- MISO → pin 12
- SCK → pin 13
- VCC → 5V (or 3.3V according to your module requirements)
- GND → GND
- SDA/SCL → A4/A5 for I²C configuration

Make sure `OV2640_MINI_2MP` is enabled in `memorysaver.h` of the ArduCAM library.

## Arduino sketch
1. Install the [ArduCAM library](https://github.com/ArduCAM/Arduino) in the Arduino IDE.
2. Open `arduino/OV2640_Capture/OV2640_Capture.ino` and upload it to the Uno at 921600 baud.
3. Open the Serial Monitor (newline line endings) and send `c` to trigger a capture. The sketch streams a single JPEG over serial using a simple text header.

## PC capture script
Use the Python helper to request a frame and save it locally:

```bash
python scripts/capture_ov2640.py --port /dev/ttyACM0 --baud 921600 --output capture.jpg
```

On Windows, replace `/dev/ttyACM0` with the appropriate COM port (e.g., `COM5`).
