/**
 * Real-time WebRTC VLM Multi-Object Detection - Main Server
 * This file now serves as a proxy to the backend
 */

// For backward compatibility, redirect to backend
const path = require('path');
const { spawn } = require('child_process');

console.log('🔄 Redirecting to backend server...');

// Start the backend server
const backendPath = path.join(__dirname, 'backend');
const backendServer = spawn('node', ['server.js'], {
  cwd: backendPath,
  stdio: 'inherit'
});

backendServer.on('error', (error) => {
  console.error('❌ Failed to start backend server:', error);
  process.exit(1);
});

backendServer.on('close', (code) => {
  console.log(`Backend server exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down...');
  backendServer.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down...');
  backendServer.kill('SIGINT');
});
