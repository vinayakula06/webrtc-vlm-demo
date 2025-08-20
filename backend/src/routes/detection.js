/**
 * Detection API Routes
 */

const express = require('express');
const detectionController = require('../controllers/detection');
const { rateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Rate limiting for detection endpoints
router.use('/detect', rateLimiter);

/**
 * @route POST /api/detect
 * @desc Detect objects in image
 * @body { image: string (base64), modelType?: string }
 */
router.post('/detect', detectionController.detectObjects);

/**
 * @route GET /api/models
 * @desc Get available detection models
 */
router.get('/models', detectionController.getAvailableModels);

/**
 * @route GET /api/models/:modelType
 * @desc Get specific model information
 */
router.get('/models/:modelType', detectionController.getModelInfo);

/**
 * @route GET /api/detection/health
 * @desc Health check for detection service
 */
router.get('/detection/health', detectionController.healthCheck);

module.exports = router;
