# Firmware

A [PlatformIO](https://platformio.org/) project that pulls animated GIFs from a server and displays them on an [Adafruit MatrixPortal ESP32-S3](https://www.adafruit.com/product/5778) driving a 128x32 RGB LED matrix.

## Architecture

```
Applets (TypeScript)
        │  rendered server-side via node-canvas
        ▼
Renderer (Express)
        │  encodes frames as animated GIF
        ▼
HTTP GET /render
        │
        ▼
Firmware (ESP32-S3)          ──►  128×32 RGB LED Matrix
  downloads GIF over Wi-Fi        driven by Adafruit Protomatter
  decodes with AnimatedGIF        via DMA
```

The firmware runs a simple loop:

1. Download an animated GIF from the renderer's `/render` endpoint.
2. Decode and display each frame on the LED matrix using the AnimatedGIF library.
3. When the GIF finishes, fetch the next one.

The renderer rotates through registered applets (NYC train times, Spotify now-playing, Conway's Game of Life, DVD logo, etc.) via a round-robin scheduler. Each request returns a different applet's animation.

## Hardware

| Component | Value |
|---|---|
| Board | [Adafruit MatrixPortal ESP32-S3](https://www.adafruit.com/product/5778) |
| MCU | ESP32-S3 |
| Display | 128 x 32 RGB LED matrix (HUB75) |
| Bit depth | 5 (32 brightness levels per channel) |
| Status LED | NeoPixel on pin 4 |
| Framework | Arduino |

### Pin Mapping

| Signal | Pin(s) |
|---|---|
| RGB data | 42, 41, 40, 38, 39, 37 |
| Address lines | 45, 36, 48, 35, 21 |
| Clock | 2 |
| Latch | 47 |
| OE | 14 |
| Status NeoPixel | 4 |

## Configuration

### `secrets.h`

Copy `src/secrets.h.example` to `src/secrets.h` and fill in your values:

```cpp
#define WIFI_SSID "your-ssid"
#define WIFI_PASS "your-password"
#define RENDERER_URL "https://your-renderer-host/render"
```

This file is git-ignored.

### `platformio.ini`

| Setting | Value |
|---|---|
| Platform | espressif32 |
| Board | adafruit_matrixportal_esp32s3 |
| Framework | Arduino |
| Monitor speed | 9600 baud |

#### Library Dependencies

| Library | Version | Purpose |
|---|---|---|
| [Adafruit Protomatter](https://github.com/adafruit/Adafruit_Protomatter) | ^1.5.10 | DMA-driven HUB75 matrix driver |
| [AnimatedGIF](https://github.com/bitbank2/AnimatedGIF) | ^1.4.7 | GIF decoding from RAM |
| [Adafruit NeoPixel](https://github.com/adafruit/Adafruit_NeoPixel) | ^1.12.0 | Status LED control |

### Build-time Constants

| Constant | Default | Description |
|---|---|---|
| `WIDTH` | 128 | Matrix width in pixels |
| `HEIGHT` | 32 | Matrix height in pixels |
| `GIFminimumTime` | 10 | Minimum display time (seconds) before fetching the next GIF |
| `DEBUG` | false | Enable serial-wait and status LED messages. Set to `false` before standalone upload. |
| `bitDepth` | 5 | Protomatter color depth (bits per channel) |

## Upload Instructions

1. Hold the **BOOT** button on the MatrixPortal.
2. While holding BOOT, press and release **RESET**.
3. Release **BOOT**. The board is now in bootloader mode.
4. In PlatformIO, run **Upload & Monitor**.
5. Wait for the upload to reach 100%, then press **RESET**.

## Known Issues

- **GIF data buffer is freed too early.** The downloaded GIF byte array is `delete[]`'d immediately after `GIF.open()`, but the AnimatedGIF library holds a pointer to that buffer and reads from it lazily during `playFrame()`. This is a use-after-free bug that can cause flickering or corrupted frames.
- **No screen clearing between animations.** The matrix back buffer is not cleared when transitioning to a new GIF. If the new animation has different dimensions, remnants of the previous frame can bleed through.
- **`GIFminimumTime` is declared but never checked.** Each GIF plays through exactly once before the firmware fetches the next one, regardless of this setting.
- **No Wi-Fi reconnection.** If the Wi-Fi connection drops, there is no logic to re-establish it.
- **No HTTP error retry/backoff.** A failed download immediately retries in a tight loop. Additionally, if the server omits a `Content-Length` header, `http.getSize()` returns `-1` and the subsequent allocation wraps to an enormous value.
