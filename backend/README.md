# WebRTC VLM Multi-Object Detection - Backend

Professional backend implementation for real-time object detection using WebRTC streaming.

## Architecture

```
backend/
├── server.js              # Main server entry point
├── package.json           # Dependencies and scripts
├── src/
│   ├── app.js             # Express application setup
│   ├── config/
│   │   └── server.js      # Server configuration
│   ├── controllers/
│   │   ├── detection.js   # Object detection API controller
│   │   └── webrtc.js      # WebRTC signaling controller
│   ├── services/
│   │   ├── detection.js   # AI model inference service
│   │   └── data/
│   │       └── cocoClasses.json
│   ├── routes/
│   │   └── detection.js   # API route definitions
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   └── utils/
│       ├── ssl.js
│       ├── imageProcessing.js
│       ├── validation.js
│       └── logger.js
├── models/                # AI model files
├── ssl/                   # SSL certificates
│   ├── cert.pem
│   └── key.pem
└── logs/                  # Application logs (auto-created)
```

## Features

- **Object Detection**: Support for multiple AI models (MobileNet-SSD, YOLO, COCO-SSD)
- **WebRTC Signaling**: Real-time peer-to-peer video streaming
- **RESTful API**: Clean API endpoints for detection services
- **Error Handling**: Comprehensive error handling and logging
- **Rate Limiting**: Protection against API abuse
- **SSL/HTTPS**: Secure connections for mobile camera access
- **Image Processing**: Advanced image preprocessing and optimization
- **Validation**: Input validation and sanitization
- **Logging**: Structured logging with multiple levels

## Installation

```bash
cd backend
npm install
```

## Configuration

Configuration is handled in `src/config/server.js`:

- **Ports**: HTTP (3000), HTTPS (3443)
- **SSL**: Certificate paths and settings
- **Detection**: Confidence thresholds, model settings
- **WebRTC**: ICE servers and connection settings
- **Security**: Rate limiting, CORS, validation rules

## Running the Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

## API Endpoints

### Object Detection

```bash
POST /api/detect
Body: { image: "base64_image_data", modelType?: "mobilenet-ssd" }
```

### Models

```bash
GET /api/models                    # Get available models
GET /api/models/:modelType         # Get specific model info
GET /api/detection/health          # Detection service health check
```

### System

```bash
GET /health                        # System health check
```

## WebRTC Signaling

Socket.IO events for WebRTC peer connection management:

- `join-room` - Join a room as sender/receiver
- `sender-ready` - Signal that sender is ready
- `offer`, `answer` - WebRTC offer/answer exchange
- `ice-candidate` - ICE candidate exchange
- `frame-data` - Video frame data transmission

## Security Features

- **Rate Limiting**: 60 requests/minute for detection endpoints
- **Input Validation**: Comprehensive validation for all inputs
- **HTTPS Only**: Encrypted connections required
- **CORS Protection**: Configurable CORS policies
- **Error Sanitization**: Safe error messages in production

## Model Support

### Supported Models

1. **MobileNet-SSD** (ONNX)
   - Fast inference for mobile/edge devices
   - 300x300 input resolution
   - COCO object classes

2. **YOLOv5s** (ONNX)
   - High accuracy object detection
   - 640x640 input resolution
   - COCO object classes

3. **COCO-SSD** (TensorFlow.js)
   - Browser-compatible model
   - Real-time inference

### Adding New Models

1. Place model file in `models/` directory
2. Add model configuration in `src/services/detection.js`
3. Update model registry with metadata
4. Implement post-processing if needed

## Development

### Project Structure

- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and AI model operations
- **Routes**: API endpoint definitions
- **Middleware**: Cross-cutting concerns (auth, validation, etc.)
- **Utils**: Helper functions and utilities

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Production Deployment

1. **Environment Variables**: Set NODE_ENV=production
2. **SSL Certificates**: Replace self-signed certs with proper certificates
3. **Model Files**: Ensure all model files are present in models/
4. **Logging**: Configure log levels and file rotation
5. **Monitoring**: Set up health check monitoring

## Performance Optimization

- **Image Processing**: Efficient tensor operations with TensorFlow.js
- **Memory Management**: Proper tensor cleanup and garbage collection
- **Caching**: Model caching to avoid repeated loading
- **Compression**: Image compression for network efficiency
- **Rate Limiting**: Prevent resource exhaustion

## Troubleshooting

### Common Issues

1. **SSL Certificate Errors**: Accept self-signed certificate warnings in development
2. **Model Loading Failures**: Check model file paths and permissions
3. **Memory Issues**: Monitor tensor cleanup and model memory usage
4. **WebRTC Connection Issues**: Verify ICE server configuration

### Logs

Application logs are written to:
- Console (development)
- `logs/` directory (production)
- Structured JSON format for log aggregation

## License

MIT
