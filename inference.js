// inference.js
// Unified backend inference for ONNX and TensorFlow models

const ort = require('onnxruntime-node');
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

// Model registry
const MODELS = {
  'mobilenet-ssd-onnx': {
    type: 'onnx',
    path: path.join(__dirname, 'models', 'mobilenet-ssd.onnx')
  },
  'yolo-onnx': {
    type: 'onnx',
    path: path.join(__dirname, 'models', 'yolov4.onnx')
  },
  'yolo-quant-onnx': {
    type: 'onnx',
    path: path.join(__dirname, 'models', 'yolov4-quant.onnx')
  },
  'ssd-tfjs': {
    type: 'tfjs',
    path: path.join(__dirname, 'models', 'ssd_model')
  },
  'yolo-tfjs': {
    type: 'tfjs',
    path: path.join(__dirname, 'models', 'yolo_model')
  }
};


// COCO or VOC labels for MobileNet-SSD (example, update as needed)
const MOBILENET_SSD_LABELS = [
  'background', 'aeroplane', 'bicycle', 'bird', 'boat', 'bottle', 'bus', 'car', 'cat', 'chair',
  'cow', 'diningtable', 'dog', 'horse', 'motorbike', 'person', 'pottedplant', 'sheep', 'sofa', 'train', 'tvmonitor'
];

function mobilenetSSDPostprocess(outputs, imageShape, confThreshold = 0.5) {
  // Typical output: { 'scores': Float32Array, 'boxes': Float32Array }
  // Some models output a single Float32Array with [batch, num_detections, 7]
  let detections = [];
  let output = outputs[Object.keys(outputs)[0]];
  let data = output.data || output;
  let shape = output.dims || [1, data.length / 7, 7];
  // Each detection: [image_id, label, conf, x_min, y_min, x_max, y_max]
  for (let i = 0; i < shape[1]; ++i) {
    let base = i * 7;
    let conf = data[base + 2];
    if (conf < confThreshold) continue;
    let labelIdx = data[base + 1];
    let label = MOBILENET_SSD_LABELS[labelIdx] || 'unknown';
    let [x_min, y_min, x_max, y_max] = [data[base+3], data[base+4], data[base+5], data[base+6]];
    // Optionally scale to image size
    detections.push({
      label,
      confidence: conf,
      bbox: [x_min, y_min, x_max, y_max]
    });
  }
  return detections;
}

async function runONNXModel(modelPath, inputTensor, opts = {}) {
  const session = await ort.InferenceSession.create(modelPath);
  const feeds = {};
  feeds[session.inputNames[0]] = inputTensor;
  const results = await session.run(feeds);
  if (opts.modelName === 'mobilenet-ssd-onnx') {
    // Assume inputTensor shape: [1, 3, H, W] or [1, H, W, 3]
    const imageShape = inputTensor.shape;
    return mobilenetSSDPostprocess(results, imageShape, opts.confThreshold || 0.5);
  }
  return results;
}

async function runTFJSModel(modelPath, inputTensor) {
  const model = await tf.loadGraphModel('file://' + modelPath + '/model.json');
  const results = model.execute(inputTensor);
  return results;
}

async function runInference({ modelName, imageTensor, confThreshold }) {
  const modelInfo = MODELS[modelName];
  if (!modelInfo) throw new Error('Model not found');
  if (modelInfo.type === 'onnx') {
    return runONNXModel(modelInfo.path, imageTensor, { modelName, confThreshold });
  } else if (modelInfo.type === 'tfjs') {
    return runTFJSModel(modelInfo.path, imageTensor);
  } else {
    throw new Error('Unsupported model type');
  }
}

module.exports = { runInference, MODELS };
