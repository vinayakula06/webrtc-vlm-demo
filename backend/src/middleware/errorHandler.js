/**
 * Error Handler Middleware
 */

const config = require('../config/server');

function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
    code = 'UNAUTHORIZED';
  } else if (err.status) {
    statusCode = err.status;
    message = err.message;
  }

  // Don't expose internal errors in production
  if (config.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
  }

  res.status(statusCode).json({
    error: message,
    code,
    timestamp: new Date().toISOString(),
    ...(config.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
