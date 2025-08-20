/**
 * Server Configuration
 */

const { execSync } = require('child_process');
const os = require('os');

// Get network IP address
function getNetworkIP() {
  try {
    const networkInterfaces = os.networkInterfaces();
    for (const name of Object.keys(networkInterfaces)) {
      for (const net of networkInterfaces[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not determine network IP, using localhost');
  }
  return 'localhost';
}

const config = {
  // Server settings
  HOST: '0.0.0.0',
  HTTP_PORT: 3000,
  HTTPS_PORT: 3443,
  NETWORK_IP: getNetworkIP(),
  
  // SSL settings
  SSL_CERT_PATH: '../ssl/cert.pem',
  SSL_KEY_PATH: '../ssl/key.pem',
  
  // Object detection settings
  DETECTION_CONFIDENCE_THRESHOLD: 0.3,
  MAX_DETECTIONS: 20,
  
  // WebRTC settings
  ICE_SERVERS: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ],
  
  // Frame processing settings
  MAX_FRAME_SIZE: 10 * 1024 * 1024, // 10MB
  FRAME_COMPRESSION_QUALITY: 0.8,
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

module.exports = config;
