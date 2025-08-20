/**
 * Express Application Setup
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

const detectionRoutes = require('./routes/detection');
const webrtcController = require('./controllers/webrtc');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config/server');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files - serve frontend from public directory
app.use(express.static(path.join(__dirname, '../../public')));

// API Routes
app.use('/api', detectionRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/receiver.html'));
});

// Error handling middleware
app.use(errorHandler);

// Create HTTP server for Socket.IO
const httpServer = createServer(app);

// Setup Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ["GET", "POST"]
  },
  transports: ['polling', 'websocket']
});

// Setup WebRTC signaling
webrtcController.setupSocketHandlers(io);

module.exports = app;
module.exports.httpServer = httpServer;
module.exports.io = io;
