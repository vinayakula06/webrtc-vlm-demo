# AI Models Directory

This directory contains optimized AI models for better object detection performance.

## Supported Model Types

### 1. ONNX Models (Recommended)
- **YOLOv8n** - Ultra-fast YOLO variant optimized for real-time detection
- **MobileNet-SSD** - Lightweight SSD model optimized for mobile devices
- **YOLOv5s** - Balanced speed and accuracy

### 2. TensorFlow Lite Models
- **SSD MobileNet v2** - Quantized for faster inference
- **EfficientDet** - State-of-the-art accuracy with reasonable speed

### 3. Fallback Models
- **COCO-SSD** - Built-in TensorFlow.js model (always available)

## Model Download Instructions

### Download YOLOv8n ONNX (Recommended)
```bash
# Download YOLOv8 nano model (6MB)
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.onnx

# Or use curl
curl -L -o yolov8n.onnx https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.onnx
```

### Download MobileNet-SSD ONNX
```bash
# Download MobileNet SSD model (27MB)
wget https://github.com/onnx/models/raw/main/vision/object_detection_segmentation/ssd-mobilenetv1/model/ssd_mobilenet_v1_10.onnx
```

### Download Quantized TensorFlow Lite Models
```bash
# Download quantized SSD MobileNet v2 (10MB)
wget https://storage.googleapis.com/download.tensorflow.org/models/tflite/coco_ssd_mobilenet_v1_1.0_quant_2018_06_29.zip
unzip coco_ssd_mobilenet_v1_1.0_quant_2018_06_29.zip
```

## Model Performance Comparison

| Model | Size | Speed (FPS) | Accuracy (mAP) | Device Support |
|-------|------|-------------|----------------|----------------|
| YOLOv8n | 6MB | 15-25 | 37.3 | Desktop/Mobile |
| MobileNet-SSD | 27MB | 10-20 | 23.2 | Mobile Optimized |
| COCO-SSD | 13MB | 5-15 | 25.0 | Universal |

## Usage

The system automatically tries to load models in this priority order:
1. **YOLOv8n ONNX** (best performance)
2. **MobileNet-SSD ONNX** (mobile optimized)
3. **COCO-SSD TensorFlow** (fallback)

Place model files in this directory and they will be auto-detected.

## Local Model Serving

To serve models locally instead of CDN:

1. Place model files in this directory
2. Update model URLs in `receiver.html` to local paths
3. Restart the server

Example:
```javascript
{
  name: 'YOLOv8n-Local',
  type: 'onnx',
  url: '/models/yolov8n.onnx', // Local path
  inputSize: [640, 640],
  classes: 80
}
```

## Model Conversion Tools

### Convert PyTorch to ONNX
```python
import torch
from ultralytics import YOLO

# Load YOLOv8 model
model = YOLO('yolov8n.pt')

# Export to ONNX
model.export(format='onnx', optimize=True)
```

### Convert TensorFlow to TensorFlow Lite
```python
import tensorflow as tf

# Convert SavedModel to TFLite
converter = tf.lite.TFLiteConverter.from_saved_model('model/')
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()

with open('model.tflite', 'wb') as f:
    f.write(tflite_model)
```

## Notes

- ONNX models provide the best performance and compatibility
- TensorFlow Lite models are excellent for mobile deployment
- The system gracefully falls back to COCO-SSD if other models fail
- All models support the same 80 COCO object classes
- Models are cached after first load for better performance
