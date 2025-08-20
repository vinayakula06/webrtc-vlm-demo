/**
 * SSL Utilities
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/server');

/**
 * Setup SSL certificates and create HTTPS server
 */
async function setupSSL(app) {
  try {
    const certPath = path.resolve(__dirname, config.SSL_CERT_PATH);
    const keyPath = path.resolve(__dirname, config.SSL_KEY_PATH);

    // Read SSL certificates
    const cert = await fs.readFile(certPath, 'utf8');
    const key = await fs.readFile(keyPath, 'utf8');

    // Create HTTPS server
    const httpsServer = https.createServer({ key, cert }, app);

    return { httpsServer, cert, key };

  } catch (error) {
    console.error('❌ SSL setup failed:', error);
    throw new Error('Failed to setup SSL certificates');
  }
}

/**
 * Generate self-signed certificate (for development)
 */
async function generateSelfSignedCert() {
  const { execSync } = require('child_process');
  const certDir = path.resolve(__dirname, '../ssl');

  try {
    // Create ssl directory if it doesn't exist
    await fs.mkdir(certDir, { recursive: true });

    // Generate self-signed certificate
    execSync(`openssl req -x509 -newkey rsa:4096 -keyout ${certDir}/key.pem -out ${certDir}/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`, {
      stdio: 'inherit'
    });

    console.log('✅ Self-signed certificate generated');

  } catch (error) {
    console.error('❌ Failed to generate self-signed certificate:', error);
    throw error;
  }
}

module.exports = {
  setupSSL,
  generateSelfSignedCert
};
