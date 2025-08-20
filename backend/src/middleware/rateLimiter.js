/**
 * Rate Limiting Middleware
 */

const rateLimit = require('express-rate-limit');

// Rate limiter for detection endpoints
const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  message: {
    error: 'Too many detection requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many detection requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString()
    });
  }
});

// Stricter rate limiter for heavy operations
const strictRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many requests from this IP for this endpoint, please try again later.',
    code: 'STRICT_RATE_LIMIT_EXCEEDED'
  }
});

module.exports = {
  rateLimiter,
  strictRateLimiter
};
