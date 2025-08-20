// server.js
const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const os = require('os');

// Inference module for ONNX/TF models
const { runInference, MODELS } = require('./inference');
const tf = require('@tensorflow/tfjs-node');

const app = express();

// Check for HTTP mode flag
const forceHTTP = process.env.HTTP_MODE === 'true' || process.argv.includes('--http');

// Try to create HTTPS server, fallback to HTTP
let server;
let useHTTPS = false;

if (forceHTTP) {
  console.log('🌐 HTTP mode forced - using HTTP server');
  server = http.createServer(app);
} else {
  try {
    // Check if SSL certificate files exist
    if (fs.existsSync('cert.pem') && fs.existsSync('key.pem')) {
      const options = {
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem')
      };
      server = https.createServer(options, app);
      useHTTPS = true;
      console.log('🔒 HTTPS server created (required for mobile camera access)');
    } else {
      throw new Error('SSL certificates not found');
    }
  } catch (error) {
    console.log('⚠️  HTTPS not available, using HTTP (camera may not work on mobile)');
    server = http.createServer(app);
  }
}

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Function to get the network IP address
function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal (localhost) and non-IPv4 addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost'; // fallback
}

app.use(express.static('public'));

// Serve AI models from models directory with proper headers
app.use('/models', express.static('models', {
  setHeaders: (res, path) => {
    // Set appropriate headers for different model formats
    if (path.endsWith('.onnx')) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    } else if (path.endsWith('.tflite')) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    } else if (path.endsWith('.bin') || path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// API endpoint to list available models
app.get('/api/models', (req, res) => {
  try {
    const modelsDir = './models';
    if (!fs.existsSync(modelsDir)) {
      return res.json({ models: [], message: 'Models directory not found' });
    }
    
    const files = fs.readdirSync(modelsDir);
    const modelFiles = files.filter(file => 
      file.endsWith('.onnx') || 
      file.endsWith('.tflite') || 
      file.endsWith('.bin')
    );
    
    const models = modelFiles.map(file => {
      const stats = fs.statSync(`${modelsDir}/${file}`);
      return {
        name: file,
        path: `/models/${file}`,
        size: stats.size,
        modified: stats.mtime,
        type: file.split('.').pop()
      };
    });
    
    res.json({ models, count: models.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list models', details: error.message });
  }
});

// Object detection API endpoint
app.post('/api/detect', express.json({limit: '10mb'}), async (req, res) => {
  try {
    const { model, image_b64, confThreshold } = req.body;
    if (!model || !image_b64) return res.status(400).json({ error: 'Missing model or image_b64' });
    if (!MODELS[model]) return res.status(400).json({ error: 'Model not found' });

    // Decode base64 image to tensor
    const buffer = Buffer.from(image_b64, 'base64');
    const imageTensor = tf.node.decodeImage(buffer, 3).expandDims(0);

    // Run inference (with postprocessing for MobileNet-SSD)
    const results = await runInference({ modelName: model, imageTensor, confThreshold });

    res.json({ results });
  } catch (err) {
    console.error('Detection error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Generate QR code endpoint
app.get('/qr/:room', async (req, res) => {
  try {
    const room = req.params.room;
    const networkIP = getNetworkIP();
    const port = process.env.PORT || 3000;
    const httpsPort = process.env.HTTPS_PORT || 3443;
    // Use HTTPS if available, otherwise HTTP
    const protocol = useHTTPS ? 'https' : 'http';
    const actualPort = useHTTPS ? httpsPort : port;
    const senderUrl = `${protocol}://${networkIP}:${actualPort}/sender.html?room=${encodeURIComponent(room)}`;
    console.log('[QR] Generating QR for room:', room);
    console.log('[QR] networkIP:', networkIP, 'protocol:', protocol, 'port:', actualPort);
    console.log('[QR] senderUrl:', senderUrl);
    const qrCodeDataURL = await QRCode.toDataURL(senderUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    if (!qrCodeDataURL) {
      console.error('[QR] Failed to generate QR code data URL');
    }
    res.json({ 
      qrCode: qrCodeDataURL, 
      senderUrl,
      networkIP,
      port: actualPort,
      protocol,
      useHTTPS
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code', details: error.message });
  }
});

// simple page
app.get('/', (req,res) => res.sendFile(__dirname + '/public/receiver.html'));

// mobile test page
app.get('/test-mobile', (req,res) => res.sendFile(__dirname + '/test-mobile.html'));

io.on('connection', socket => {
  console.log('socket connected', socket.id);

  socket.on('join', ({room, role, type}) => {
    socket.join(room);
    socket.role = role || type; // Support both 'role' and 'type' for different components
    socket.room = room;
    console.log(`${socket.id} joined ${room} as ${socket.role}`);
    
    // For simple test - notify specific peer types
    if (socket.role === 'receiver') {
      // Tell existing senders that receiver is ready
      socket.to(room).emit('receiver-ready', {receiverId: socket.id});
    } else if (socket.role === 'sender') {
      // Tell existing receivers that sender joined
      socket.to(room).emit('sender-joined', {senderId: socket.id});
    }
    
    // Notify others in the room about the new peer (backward compatibility)
    socket.to(room).emit('peer-joined', {id: socket.id, role: socket.role});
  });

  // WebRTC signaling - improved with better logging
  socket.on('offer', ({room, desc, to}) => {
    console.log(`📤 Forwarding offer from ${socket.id} to ${to || 'room'}`);
    if (to) {
      io.to(to).emit('offer', {desc, from: socket.id});
    } else {
      socket.to(room).emit('offer', {desc, from: socket.id});
    }
  });
  
  socket.on('answer', ({to, desc}) => {
    console.log(`📤 Forwarding answer from ${socket.id} to ${to}`);
    io.to(to).emit('answer', {desc, from: socket.id});
  });
  
  socket.on('ice-candidate', ({to, candidate, room}) => {
    console.log(`🧊 ICE CANDIDATE from ${socket.id}:`, {
      to: to,
      room: room,
      candidateType: candidate?.type || 'unknown',
      candidate: candidate?.candidate || 'no-candidate'
    });
    if (to) {
      console.log(`✅ Forwarding ICE candidate to specific peer: ${to}`);
      io.to(to).emit('ice-candidate', {candidate, from: socket.id});
    } else if (room) {
      console.log(`✅ Broadcasting ICE candidate to room: ${room}`);
      socket.to(room).emit('ice-candidate', {candidate, from: socket.id});
    } else {
      console.error(`❌ ICE candidate has no target - to: ${to}, room: ${room}`);
    }
  });

  // Sender signals that tracks are ready for WebRTC negotiation
  socket.on('sender-ready', () => {
    console.log(`📡 Sender ${socket.id} ready with tracks`);
    if (socket.room) {
      // include senderId so receivers that missed the peer-joined event can still
      // identify the sender and create an offer
      socket.to(socket.room).emit('sender-ready', { senderId: socket.id });
    }
  });

  // frame metadata from sender -> forward to peers (used to compute capture_ts)
  socket.on('frame_meta', (meta) => {
    if (socket.room) socket.to(socket.room).emit('frame_meta', meta);
  });

  // frame payload (base64 jpg) - used for server-mode inference (if you implement it)
  socket.on('frame', async (payload) => {
    // payload: { image_b64 }
    console.log('📸 Received frame data, size:', payload.image_b64 ? payload.image_b64.length : 'no data');
    
    // Skip backend inference for now to avoid TensorFlow.js errors
    // Just forward the frame notification to receivers
    if (socket.room) socket.to(socket.room).emit('frame', { frame_id: 'auto_' + Date.now() });
  });

  // external inference worker can emit 'detection' messages to room
  socket.on('detection', (det) => {
    if (socket.room) io.to(socket.room).emit('detection', det);
  });

  socket.on('disconnect', () => {
    console.log('disconnect', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

server.listen(useHTTPS ? HTTPS_PORT : PORT, '0.0.0.0', () => {
  const networkIP = getNetworkIP();
  const protocol = useHTTPS ? 'https' : 'http';
  const port = useHTTPS ? HTTPS_PORT : PORT;
  
  console.log(`Server running on:`);
  console.log(`- Local: ${protocol}://localhost:${port}`);
  console.log(`- Network: ${protocol}://${networkIP}:${port}`);
  
  if (useHTTPS) {
    console.log(`\n🔒 HTTPS enabled - Mobile camera access should work!`);
    console.log(`⚠️  You may need to accept the self-signed certificate warning.`);
  } else {
    console.log(`\n⚠️  HTTP only - Mobile camera may not work. Generate SSL certs for HTTPS.`);
  }
  
  console.log(`\nFor mobile access, use the network URL or scan the QR code on the webpage.`);
});