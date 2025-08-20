/**
 * Validation Utilities
 */

/**
 * Validate base64 image string
 */
function validateBase64Image(base64String) {
  if (!base64String || typeof base64String !== 'string') {
    return false;
  }

  // Check if it's a valid base64 string
  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
  
  if (!base64Regex.test(base64Data)) {
    return false;
  }

  // Check if it's a reasonable size (not too small, not too large)
  const sizeInBytes = (base64Data.length * 3) / 4;
  const minSize = 100; // 100 bytes
  const maxSize = 10 * 1024 * 1024; // 10MB

  return sizeInBytes >= minSize && sizeInBytes <= maxSize;
}

/**
 * Validate detection model type
 */
function validateModelType(modelType) {
  const validModels = ['mobilenet-ssd', 'yolov5s', 'coco-ssd'];
  return validModels.includes(modelType);
}

/**
 * Validate room name
 */
function validateRoomName(roomName) {
  if (!roomName || typeof roomName !== 'string') {
    return false;
  }

  // Room name should be alphanumeric with optional hyphens/underscores
  const roomRegex = /^[a-zA-Z0-9_-]{1,50}$/;
  return roomRegex.test(roomName);
}

/**
 * Validate user role
 */
function validateUserRole(role) {
  const validRoles = ['sender', 'receiver'];
  return validRoles.includes(role);
}

/**
 * Sanitize input string
 */
function sanitizeString(input, maxLength = 100) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>\"'&]/g, ''); // Remove potentially dangerous characters
}

/**
 * Validate coordinate values
 */
function validateCoordinates(x, y, width, height) {
  return (
    typeof x === 'number' && x >= 0 && x <= 1 &&
    typeof y === 'number' && y >= 0 && y <= 1 &&
    typeof width === 'number' && width > 0 && width <= 1 &&
    typeof height === 'number' && height > 0 && height <= 1
  );
}

/**
 * Validate confidence score
 */
function validateConfidence(confidence) {
  return typeof confidence === 'number' && confidence >= 0 && confidence <= 1;
}

module.exports = {
  validateBase64Image,
  validateModelType,
  validateRoomName,
  validateUserRole,
  sanitizeString,
  validateCoordinates,
  validateConfidence
};
