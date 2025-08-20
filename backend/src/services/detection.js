/**
 * Object Detection Service
 * Handles AI model inference for object detection
 */

const tf = require('@tensorflow/tfjs-node');
const ort = require('onnxruntime-node');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config/server');
const { base64ToBuffer, bufferToImageTensor } = require('../utils/imageProcessing');

class DetectionService {
  constructor() {
    this.models = new Map();
    this.modelRegistry = {
      'mobilenet-ssd': {
        type: 'onnx',
        path: '../models/mobilenet-ssd.onnx',
        inputSize: [300, 300],
        classes: require('./data/cocoClasses.json'),
        description: 'MobileNet-SSD COCO object detector'
      },
      'yolov5s': {
        type: 'onnx', 
        path: '../models/yolov5s.onnx',
        inputSize: [640, 640],
        classes: require('./data/cocoClasses.json'),
        description: 'YOLOv5s object detector'
      },
      'coco-ssd': {
        type: 'tensorflow',
        path: '@tensorflow-models/coco-ssd',
        description: 'TensorFlow.js COCO-SSD model'
      }
    };
  }

  /**
   * Initialize detection service
   */
  async initialize() {
    console.log('🤖 Initializing Object Detection Service...');
    
    try {
      // Load default model
      await this.loadModel('mobilenet-ssd');
      console.log('✅ Detection service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize detection service:', error);
      throw error;
    }
  }

  /**
   * Load a specific model
   */
  async loadModel(modelType) {
    if (this.models.has(modelType)) {
      return this.models.get(modelType);
    }

    const modelConfig = this.modelRegistry[modelType];
    if (!modelConfig) {
      throw new Error(`Unknown model type: ${modelType}`);
    }

    console.log(`📥 Loading model: ${modelType}`);

    try {
      let model;
      
      if (modelConfig.type === 'onnx') {
        const modelPath = path.resolve(__dirname, modelConfig.path);
        
        // Check if model file exists
        try {
          await fs.access(modelPath);
        } catch {
          console.warn(`⚠️ Model file not found: ${modelPath}`);
          // Return a mock model for now
          model = this.createMockModel(modelType);
        }
        
        if (!model) {
          model = await ort.InferenceSession.create(modelPath);
        }
        
      } else if (modelConfig.type === 'tensorflow') {
        // For TensorFlow.js models
        if (modelConfig.path.startsWith('@tensorflow-models/')) {
          // These would be loaded dynamically in a real implementation
          model = this.createMockModel(modelType);
        } else {
          model = await tf.loadLayersModel(modelConfig.path);
        }
      }

      this.models.set(modelType, { model, config: modelConfig });
      console.log(`✅ Model loaded: ${modelType}`);
      
      return { model, config: modelConfig };
      
    } catch (error) {
      console.error(`❌ Failed to load model ${modelType}:`, error);
      throw error;
    }
  }

  /**
   * Create a mock model for testing when actual model files aren't available
   */
  createMockModel(modelType) {
    return {
      isMock: true,
      modelType,
      run: async () => ({
        output: new Float32Array([
          // Mock detection: person at center with high confidence
          0.1, 0.1, 0.9, 0.9, 0.95, 0, // bbox + confidence + class (person)
        ])
      }),
      detect: async () => ([
        {
          bbox: [0.1, 0.1, 0.8, 0.8],
          class: 'person',
          score: 0.95
        }
      ])
    };
  }

  /**
   * Detect objects in image
   */
  async detectObjects(imageData, modelType = 'mobilenet-ssd') {
    try {
      const { model, config: modelConfig } = await this.loadModel(modelType);

      // Convert base64 to image tensor
      const imageBuffer = base64ToBuffer(imageData);
      const imageTensor = await bufferToImageTensor(imageBuffer, modelConfig.inputSize);

      let detections = [];

      if (model.isMock) {
        // Return mock detections for testing
        detections = await model.detect();
      } else if (modelConfig.type === 'onnx') {
        detections = await this.runONNXInference(model, imageTensor, modelConfig);
      } else if (modelConfig.type === 'tensorflow') {
        detections = await this.runTensorFlowInference(model, imageTensor, modelConfig);
      }

      // Filter by confidence threshold
      detections = detections.filter(d => d.score >= config.DETECTION_CONFIDENCE_THRESHOLD);

      // Limit number of detections
      detections = detections.slice(0, config.MAX_DETECTIONS);

      return detections;

    } catch (error) {
      console.error('Detection error:', error);
      throw error;
    }
  }

  /**
   * Run ONNX model inference
   */
  async runONNXInference(session, imageTensor, modelConfig) {
    try {
      const feeds = {};
      const inputName = session.inputNames[0];
      feeds[inputName] = imageTensor;

      const results = await session.run(feeds);
      const output = results[session.outputNames[0]];

      // Post-process based on model type
      if (modelConfig.path.includes('mobilenet-ssd')) {
        return this.postprocessMobileNetSSD(output.data, modelConfig);
      } else if (modelConfig.path.includes('yolo')) {
        return this.postprocessYOLO(output.data, modelConfig);
      }

      return [];
    } catch (error) {
      console.error('ONNX inference error:', error);
      throw error;
    }
  }

  /**
   * Run TensorFlow.js model inference
   */
  async runTensorFlowInference(model, imageTensor, modelConfig) {
    try {
      const predictions = await model.detect(imageTensor);
      
      return predictions.map(pred => ({
        bbox: pred.bbox,
        class: pred.class,
        score: pred.score
      }));
    } catch (error) {
      console.error('TensorFlow inference error:', error);
      throw error;
    }
  }

  /**
   * Post-process MobileNet-SSD output
   */
  postprocessMobileNetSSD(outputData, modelConfig) {
    const detections = [];
    const numDetections = outputData.length / 7; // Each detection has 7 values

    for (let i = 0; i < numDetections; i++) {
      const startIdx = i * 7;
      const confidence = outputData[startIdx + 2];
      
      if (confidence > config.DETECTION_CONFIDENCE_THRESHOLD) {
        const classId = Math.floor(outputData[startIdx + 1]);
        const className = modelConfig.classes[classId] || `class_${classId}`;
        
        detections.push({
          bbox: [
            outputData[startIdx + 3], // x1
            outputData[startIdx + 4], // y1
            outputData[startIdx + 5], // x2
            outputData[startIdx + 6]  // y2
          ],
          class: className,
          score: confidence
        });
      }
    }

    return detections;
  }

  /**
   * Post-process YOLO output
   */
  postprocessYOLO(outputData, modelConfig) {
    // YOLO postprocessing logic would go here
    // This is a simplified version
    return [];
  }

  /**
   * Get available models
   */
  async getAvailableModels() {
    return Object.keys(this.modelRegistry).map(key => ({
      id: key,
      ...this.modelRegistry[key]
    }));
  }

  /**
   * Get model information
   */
  async getModelInfo(modelType) {
    return this.modelRegistry[modelType] || null;
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      loadedModels: Array.from(this.models.keys()),
      availableModels: Object.keys(this.modelRegistry),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new DetectionService();
