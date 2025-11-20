"""Capture a JPEG image from an Arducam OV2640 (Mini 2MP) via an Arduino Uno.

Usage:
    python capture_ov2640.py --port /dev/ttyACM0 --baud 921600 --output capture.jpg

The Arduino sketch must be running the matching serial protocol:
- Send 'c' to request a capture.
- The Arduino responds with:
    IMG-START\n
    <length>\n
    <binary JPEG bytes...>
    IMG-DONE\n
"""

import argparse
import pathlib
import sys
import time

import serial

HEADER_START = b"IMG-START"
HEADER_DONE = b"IMG-DONE"


def read_line(port: serial.Serial) -> bytes:
    """Read a line terminated by "\n" without the trailing newline."""
    line = port.readline()
    if line.endswith(b"\n"):
        return line[:-1]
    return line


def request_image(port: serial.Serial) -> bytes:
    port.reset_input_buffer()
    port.write(b"c")
    port.flush()

    # Wait for the start marker.
    start = read_line(port)
    if start != HEADER_START:
        raise RuntimeError(f"Unexpected header: {start!r}")

    length_line = read_line(port)
    try:
        length = int(length_line)
    except ValueError as exc:
        raise RuntimeError(f"Invalid length: {length_line!r}") from exc

    if length <= 0:
        raise RuntimeError(f"Non-positive length: {length}")

    data = port.read(length)
    if len(data) != length:
        raise RuntimeError(
            f"Expected {length} bytes, received {len(data)}. "
            "Check baud rate or USB stability."
        )

    # Read the trailing newline and footer marker for sanity.
    _ = read_line(port)  # trailing newline after JPEG stream
    footer = read_line(port)
    if footer != HEADER_DONE:
        raise RuntimeError(f"Unexpected footer: {footer!r}")

    return data


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", required=True, help="Serial port (e.g. /dev/ttyACM0 or COM5)")
    parser.add_argument("--baud", type=int, default=921600, help="Serial baud rate")
    parser.add_argument("--output", type=pathlib.Path, default=pathlib.Path("capture.jpg"), help="Where to save the JPEG")
    parser.add_argument("--retries", type=int, default=3, help="How many times to retry on failure")
    args = parser.parse_args()

    for attempt in range(1, args.retries + 1):
        try:
            with serial.Serial(args.port, args.baud, timeout=5) as port:
                print(f"Connected to {args.port} at {args.baud} baud")
                image = request_image(port)
        except Exception as exc:  # noqa: BLE001 - provide human-friendly message
            print(f"Attempt {attempt} failed: {exc}")
            time.sleep(1)
            continue
        else:
            args.output.write_bytes(image)
            print(f"Saved {len(image)} bytes to {args.output}")
            return 0

    print("All retries failed.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
