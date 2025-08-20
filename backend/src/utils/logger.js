/**
 * Logging Utilities
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/server');

class Logger {
  constructor() {
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    this.currentLevel = this.logLevels[config.LOG_LEVEL] || this.logLevels.info;
    this.logDir = path.join(__dirname, '../../logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    };
  }

  writeToFile(level, formattedMessage) {
    if (config.NODE_ENV === 'production') {
      const logFile = path.join(this.logDir, `${level}.log`);
      const logLine = JSON.stringify(formattedMessage) + '\n';
      
      fs.appendFile(logFile, logLine, (err) => {
        if (err) console.error('Failed to write to log file:', err);
      });
    }
  }

  log(level, message, meta = {}) {
    const levelNum = this.logLevels[level];
    
    if (levelNum <= this.currentLevel) {
      const formattedMessage = this.formatMessage(level, message, meta);
      
      // Console output with colors
      const colors = {
        error: '\x1b[31m',
        warn: '\x1b[33m',
        info: '\x1b[36m',
        debug: '\x1b[90m'
      };
      
      const reset = '\x1b[0m';
      const color = colors[level] || '';
      
      console.log(`${color}[${formattedMessage.timestamp}] ${level.toUpperCase()}: ${message}${reset}`);
      
      if (Object.keys(meta).length > 0) {
        console.log(`${color}${JSON.stringify(meta, null, 2)}${reset}`);
      }
      
      // Write to file in production
      this.writeToFile(level, formattedMessage);
    }
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // Request logging middleware
  requestLogger() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
          ip: req.ip || req.connection.remoteAddress
        };
        
        if (res.statusCode >= 400) {
          this.warn(`HTTP ${res.statusCode} - ${req.method} ${req.url}`, logData);
        } else {
          this.info(`HTTP ${res.statusCode} - ${req.method} ${req.url}`, logData);
        }
      });
      
      next();
    };
  }
}

module.exports = new Logger();
