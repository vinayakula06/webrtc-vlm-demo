/**
 * WebRTC Signaling Controller
 */

const config = require('../config/server');

class WebRTCController {
  constructor() {
    this.rooms = new Map(); // Track rooms and participants
  }

  setupSocketHandlers(io) {
    io.on('connection', (socket) => {
      console.log('socket connected', socket.id);

      // Handle room joining
      socket.on('join-room', ({ room, role }) => {
        socket.join(room);
        
        // Track user in room
        if (!this.rooms.has(room)) {
          this.rooms.set(room, { senders: [], receivers: [] });
        }
        
        const roomData = this.rooms.get(room);
        
        if (role === 'sender') {
          roomData.senders.push(socket.id);
          console.log(`${socket.id} joined ${room} as sender`);
        } else {
          roomData.receivers.push(socket.id);
          console.log(`${socket.id} joined ${room} as receiver`);
        }

        // Notify existing participants
        socket.to(room).emit('user-joined', { userId: socket.id, role });
      });

      // Handle sender ready signal
      socket.on('sender-ready', ({ room }) => {
        console.log(`📡 Sender ${socket.id} ready with tracks`);
        socket.to(room).emit('sender-ready', { senderId: socket.id });
      });

      // Handle WebRTC offer
      socket.on('offer', ({ offer, room, to }) => {
        console.log(`📤 Forwarding offer from ${socket.id} to ${to}`);
        if (to) {
          socket.to(to).emit('offer', { offer, from: socket.id });
        } else {
          socket.to(room).emit('offer', { offer, from: socket.id });
        }
      });

      // Handle WebRTC answer
      socket.on('answer', ({ answer, room, to }) => {
        console.log(`📤 Forwarding answer from ${socket.id} to ${to}`);
        if (to) {
          socket.to(to).emit('answer', { answer, from: socket.id });
        } else {
          socket.to(room).emit('answer', { answer, from: socket.id });
        }
      });

      // Handle ICE candidates
      socket.on('ice-candidate', ({ candidate, room, to }) => {
        const candidateInfo = {
          to: to || 'room',
          room,
          candidateType: candidate.type || 'unknown',
          candidate: candidate.candidate || candidate
        };
        
        console.log('🧊 ICE CANDIDATE from', socket.id + ':', candidateInfo);
        
        if (to) {
          console.log('✅ Forwarding ICE candidate to specific peer:', to);
          socket.to(to).emit('ice-candidate', { candidate, from: socket.id });
        } else {
          console.log('📡 Broadcasting ICE candidate to room:', room);
          socket.to(room).emit('ice-candidate', { candidate, from: socket.id });
        }
      });

      // Handle frame data
      socket.on('frame-data', ({ frameData, room }) => {
        const dataSize = frameData ? frameData.length : 0;
        console.log(`📸 Received frame data, size: ${dataSize}`);
        
        if (dataSize > config.MAX_FRAME_SIZE) {
          console.warn('⚠️ Frame data too large, skipping');
          return;
        }
        
        // Forward frame to all receivers in the room
        socket.to(room).emit('frame-data', { frameData, from: socket.id });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('disconnect', socket.id);
        
        // Remove user from all rooms
        for (const [roomId, roomData] of this.rooms.entries()) {
          const senderIndex = roomData.senders.indexOf(socket.id);
          const receiverIndex = roomData.receivers.indexOf(socket.id);
          
          if (senderIndex !== -1) {
            roomData.senders.splice(senderIndex, 1);
          }
          if (receiverIndex !== -1) {
            roomData.receivers.splice(receiverIndex, 1);
          }
          
          // Clean up empty rooms
          if (roomData.senders.length === 0 && roomData.receivers.length === 0) {
            this.rooms.delete(roomId);
          }
          
          // Notify other participants
          socket.to(roomId).emit('user-left', { userId: socket.id });
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });
  }

  // Get room statistics
  getRoomStats() {
    const stats = {};
    for (const [roomId, roomData] of this.rooms.entries()) {
      stats[roomId] = {
        senders: roomData.senders.length,
        receivers: roomData.receivers.length,
        total: roomData.senders.length + roomData.receivers.length
      };
    }
    return stats;
  }
}

module.exports = new WebRTCController();
