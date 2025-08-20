/**
 * Real-time WebRTC VLM Multi-Object Detection - Backend Server
 * Entry point for the application
 */

const app = require('./src/app');
const config = require('./src/config/server');
const { setupSSL } = require('./src/utils/ssl');

async function startServer() {
  try {
    // Setup SSL certificates
    const { httpsServer } = await setupSSL(app);
    
    // Start HTTPS server
    httpsServer.listen(config.HTTPS_PORT, config.HOST, () => {
      console.log('🔒 HTTPS server created (required for mobile camera access)');
      console.log('Server running on:');
      console.log(`- Local: https://localhost:${config.HTTPS_PORT}`);
      console.log(`- Network: https://${config.NETWORK_IP}:${config.HTTPS_PORT}`);
      console.log('\n🔒 HTTPS enabled - Mobile camera access should work!');
      console.log('⚠️  You may need to accept the self-signed certificate warning.');
      console.log('\nFor mobile access, use the network URL or scan the QR code on the webpage.');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
