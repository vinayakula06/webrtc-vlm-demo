# Real-time WebRTC VLM Multi-Object Detection

**One-line goal:** Build a reproducible demo that performs real-time multi-object detection on live video streamed from a phone via WebRTC, returns detection bounding boxes + labels to the browser, overlays them in near real-time.

## 🚀 Quick Start (One Command)

```bash
git clone https://github.com/Rohitk0102/webrtc-vlm-demo.git
cd webrtc-vlm-demo
./start.sh  # defaults to MODE=wasm (low-resource)
# OR
docker-compose up --build
```

Then:
1. Open http://localhost:3443 on your laptop
2. Scan the displayed QR code with your phone
3. Allow camera access on phone
4. Watch real-time object detection with overlays!

## 📱 Phone Connection Instructions

**Requirements:** Only a web browser needed (Chrome on Android, Safari on iOS - no app installs)

1. **Same Network:** Phone and laptop must be on the same Wi-Fi network
2. **Scan QR Code:** The browser displays a QR code automatically
3. **Direct URL:** Alternatively, visit the displayed network URL directly
4. **Camera Permission:** Allow camera access when prompted

**Troubleshooting Connection:**
- If phone can't reach laptop: `./start.sh --ngrok` (uses ngrok tunnel)
- Ensure both devices are on same network
- Check firewall settings

## 🎛️ Mode Switching

### WASM Mode (Low-Resource) - Default
```bash
MODE=wasm ./start.sh
# OR
docker-compose up --build
```
- **CPU Only:** Runs on modest laptops (Intel i5, 8GB RAM)
- **On-Device Inference:** ONNX Runtime Web + TensorFlow.js fallback
- **Models:** YOLOv8n, MobileNet-SSD, COCO-SSD (auto-fallback)
- **Performance:** 10-15 FPS, ~50-200ms latency
- **Resolution:** Adaptive 320×240 to 640×640

### Server Mode (High-Performance)
```bash
MODE=server ./start.sh
```
- **Server-Side Inference:** Faster processing with dedicated resources
- **Higher FPS:** 15-30 FPS possible
- **Better Models:** Full-size models without WASM constraints

## 📊 Benchmarking & Metrics

Run a 30-second benchmark to collect performance metrics:

```bash
./bench/run_bench.sh --duration 30 --mode wasm
# OR
./bench/run_bench.sh --duration 30 --mode server
```

This generates `metrics.json` with:
- **E2E Latency:** Median & P95 (overlay_display_ts - capture_ts)
- **Processed FPS:** Frames with detections displayed per second
- **Bandwidth:** Uplink/downlink kbps
- **Server Latency:** inference_ts - recv_ts
- **Network Latency:** recv_ts - capture_ts

### Sample metrics.json Output
```json
{
  "benchmark_duration_seconds": 30,
  "end_to_end_latency": {
    "median_ms": 85,
    "p95_ms": 167,
    "samples": 420
  },
  "processed_fps": {
    "average": 14,
    "samples": 420
  },
  "network_throughput": {
    "uplink_kbps": 1250,
    "downlink_kbps": 50
  },
  "server_latency": {
    "median_ms": 25,
    "p95_ms": 45
  },
  "mode": "wasm",
  "model": "YOLOv8n-ONNX"
}
```

## 🏗️ Architecture & API Contract

### Detection Results Format
```json
{
  "frame_id": "string_or_int",
  "capture_ts": 1690000000000,
  "recv_ts": 1690000000100, 
  "inference_ts": 1690000000120,
  "detections": [
    {
      "label": "person",
      "score": 0.93,
      "xmin": 0.12,
      "ymin": 0.08,
      "xmax": 0.34,
      "ymax": 0.67
    }
  ]
}
```

**Key Features:**
- **Normalized Coordinates:** [0..1] for resolution independence
- **Frame Alignment:** Uses capture_ts and frame_id for precise overlay timing
- **Multi-Model Support:** ONNX Runtime Web, TensorFlow.js with intelligent fallback

## � Technical Stack

### Client-Side (Browser)
- **WebRTC:** Real-time video streaming
- **AI Models:** ONNX Runtime Web, TensorFlow.js, COCO-SSD
- **Model Management:** Automatic model discovery and fallback
- **Canvas Overlay:** Real-time bounding box rendering

### Server-Side (Node.js)
- **WebRTC Signaling:** Socket.IO for peer connection
- **HTTPS Server:** Required for mobile camera access
- **Model Serving:** Static file serving for ONNX models
- **SSL Certificates:** Self-signed for local development

### Models Supported
- **YOLOv8 Nano:** High accuracy, ONNX format (~6MB)
- **MobileNet-SSD:** Mobile-optimized, ONNX format (~10MB)  
- **COCO-SSD:** TensorFlow.js fallback, 80 classes (~13MB)
- **Auto-Discovery:** Detects local models automatically

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)
```bash
docker-compose up --build
```

### Manual Docker Build
```bash
docker build -t webrtc-vlm-demo .
docker run -p 3443:3443 webrtc-vlm-demo
```

## � Performance Characteristics

### Low-Resource Mode (WASM)
- **CPU Usage:** ~30-50% on Intel i5, 8GB RAM
- **Memory:** ~200-400MB browser usage
- **Latency:** 50-200ms end-to-end
- **FPS:** 10-15 processed frames/second
- **Models:** Quantized ONNX models (~2-10MB)

### Server Mode  
- **CPU Usage:** ~20-40% on same hardware
- **Memory:** ~300-500MB total
- **Latency:** 30-100ms end-to-end
- **FPS:** 15-30 processed frames/second
- **Models:** Full-size models possible

## 🚦 Backpressure & Low-Resource Strategy

### Frame Management
- **Fixed-Length Queue:** Maintains recent frames, drops old ones
- **Adaptive Sampling:** Reduces FPS under CPU pressure
- **Model Fallback:** Automatically switches to lighter models on failure

### Resource Optimization
- **Resolution Scaling:** 320×240 to 640×640 based on capability
- **Frame Thinning:** Process only latest frames when overloaded
- **Memory Management:** Efficient canvas operations and model caching

## � Debugging & Development

### Browser Tools
- **WebRTC Internals:** chrome://webrtc-internals for connection stats
- **Network Tab:** Monitor bandwidth and model downloads
- **Console Logs:** Detailed AI model and detection information

### Performance Monitoring
```bash
# Monitor system resources
htop  # or top on macOS
ifstat  # network bandwidth

# Chrome DevTools getStats() API integration
# Automatic WebRTC statistics collection
```

## 📋 Project Structure

```
webrtc-vlm-demo/
├── public/
│   ├── receiver.html      # Main detection interface
│   ├── sender.html        # Phone camera interface  
│   └── style.css         # Responsive UI styling
├── models/               # AI model storage
│   ├── README.md        # Model download instructions
│   └── *.onnx          # ONNX model files
├── bench/               # Benchmarking tools
│   └── run_bench.sh    # Performance testing script
├── server.js           # WebRTC signaling server
├── start.sh           # One-command startup script
├── docker-compose.yml # Container orchestration
├── Dockerfile         # Container definition
└── TECHNICAL_REPORT.md # Design decisions & analysis
```

## 🛠️ Troubleshooting

### If phone won't connect:
- Ensure phone and laptop are on same network
- Use `./start.sh --ngrok` for public URL
- Check firewall settings

### If overlays are misaligned:
- Confirm timestamps (capture_ts) are being echoed
- Verify coordinate normalization [0..1]

### If CPU is high:
- Switch to WASM mode: `MODE=wasm ./start.sh`
- Reduce resolution to 320×240
- Use Chrome webrtc-internals to inspect performance

## 🎯 Next Improvements

1. **Edge TPU Support:** Hardware acceleration for mobile devices
2. **Model Quantization:** INT8 quantization for 2-4x speed improvement  
3. **Adaptive Bitrate:** Dynamic quality adjustment based on network
4. **Multi-Person Tracking:** Object tracking across frames
5. **Cloud Deployment:** Production-ready scaling with WebRTC SFU

## 📄 Technical Documentation

For detailed analysis of design choices, low-resource optimization, and backpressure policies, see:

**[📋 TECHNICAL_REPORT.md](TECHNICAL_REPORT.md)** - Complete technical analysis (1 page)

## 📄 License

MIT License - see LICENSE file for details.

---

**Ready to test?** Just run `./start.sh` and scan the QR code with your phone! 📱✨
```bash
npm run start-https
```

This will:
- Generate SSL certificates automatically
- Start HTTPS server on port 3443
- Show network IP for mobile access

### 3. Open on Computer
Visit: **https://192.168.1.18:3443** (use your actual IP)

### 4. Connect Phone
- Scan the QR code displayed on the webpage, OR
- Manually visit the sender URL on your phone
- Accept the SSL certificate warning
- Allow camera access when prompted

### 5. Start Detection
Click "🚀 Start WASM Inference" on the computer to begin real-time object detection!

## Network IP Detection 🌐

Check your network IP addresses:
```bash
npm run network-ip
```

## Mobile Camera Requirements 📱

Modern browsers require **HTTPS** for camera access on mobile devices. This demo automatically:

1. ✅ Generates self-signed SSL certificates
2. ✅ Runs HTTPS server on port 3443
3. ✅ Creates mobile-accessible QR codes
4. ✅ Handles camera permission requests properly

## Troubleshooting 🔧

### Camera Not Working on Mobile?
1. **Check HTTPS**: Ensure you're using `https://` not `http://`
2. **Accept Certificate**: You'll need to accept the self-signed certificate warning
3. **Same Network**: Phone and computer must be on same WiFi
4. **Browser Support**: Use Chrome/Safari on mobile for best compatibility

### Connection Issues?
1. **Firewall**: Check if ports 3443 is blocked
2. **Network**: Ensure devices are on same network
3. **IP Address**: Verify the network IP is correct

### Performance Tips 💡
- Use good lighting for better object detection
- Point camera at objects (people, furniture, etc.)
- The AI model detects 80+ common objects from COCO dataset

## Development 👨‍💻

### File Structure
```
webrtc-vlm-demo/
├── server.js              # Main server with HTTPS support
├── public/
│   ├── receiver.html       # Computer interface (AI detection)
│   ├── sender.html         # Phone interface (camera stream)
│   └── js/
│       ├── detector_wasm.js # WASM detector placeholder
│       └── overlay.js      # Drawing utilities
├── bench/                  # Performance benchmarking
├── cert.pem & key.pem     # SSL certificates (auto-generated)
└── start-servers.sh       # HTTPS startup script
```

### Available Scripts
- `npm start` - Start HTTP server (port 3000)
- `npm run start-https` - Start HTTPS server (port 3443)
- `npm run network-ip` - Show network IP addresses
- `npm run bench` - Run performance benchmarks

## Tech Stack 🛠️

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: Vanilla JS, WebRTC, TensorFlow.js
- **AI Model**: COCO-SSD object detection
- **Security**: HTTPS with self-signed certificates
- **Real-time**: WebRTC for low-latency video streaming

## Browser Support 🌐

### Desktop (Receiver)
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 14+
- ✅ Edge 80+

### Mobile (Sender)
- ✅ Chrome Mobile 80+
- ✅ Safari iOS 14+
- ⚠️ Firefox Mobile (limited WebRTC support)

---

**Happy detecting!** 🎯✨
