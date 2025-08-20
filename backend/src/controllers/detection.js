/**
 * Object Detection Controller
 */

const detectionService = require('../services/detection');
const { validateBase64Image } = require('../utils/validation');

class DetectionController {
  /**
   * Detect objects in image
   */
  async detectObjects(req, res) {
    try {
      const { image, modelType = 'mobilenet-ssd' } = req.body;

      // Validate input
      if (!image) {
        return res.status(400).json({
          error: 'Image data is required',
          code: 'MISSING_IMAGE'
        });
      }

      // Validate base64 image format
      if (!validateBase64Image(image)) {
        return res.status(400).json({
          error: 'Invalid image format. Expected base64 encoded image.',
          code: 'INVALID_IMAGE_FORMAT'
        });
      }

      // Run object detection
      const detections = await detectionService.detectObjects(image, modelType);

      res.json({
        success: true,
        detections,
        metadata: {
          modelType,
          timestamp: new Date().toISOString(),
          count: detections.length
        }
      });

    } catch (error) {
      console.error('Detection error:', error);
      
      res.status(500).json({
        error: 'Object detection failed',
        message: error.message,
        code: 'DETECTION_FAILED'
      });
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(req, res) {
    try {
      const models = await detectionService.getAvailableModels();
      
      res.json({
        success: true,
        models
      });

    } catch (error) {
      console.error('Error getting models:', error);
      
      res.status(500).json({
        error: 'Failed to get available models',
        message: error.message,
        code: 'MODELS_FETCH_FAILED'
      });
    }
  }

  /**
   * Get model info
   */
  async getModelInfo(req, res) {
    try {
      const { modelType } = req.params;
      
      const modelInfo = await detectionService.getModelInfo(modelType);
      
      if (!modelInfo) {
        return res.status(404).json({
          error: 'Model not found',
          code: 'MODEL_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        model: modelInfo
      });

    } catch (error) {
      console.error('Error getting model info:', error);
      
      res.status(500).json({
        error: 'Failed to get model info',
        message: error.message,
        code: 'MODEL_INFO_FAILED'
      });
    }
  }

  /**
   * Health check for detection service
   */
  async healthCheck(req, res) {
    try {
      const health = await detectionService.healthCheck();
      
      res.json({
        success: true,
        health
      });

    } catch (error) {
      console.error('Detection health check failed:', error);
      
      res.status(500).json({
        error: 'Detection service health check failed',
        message: error.message,
        code: 'HEALTH_CHECK_FAILED'
      });
    }
  }
}

module.exports = new DetectionController();
