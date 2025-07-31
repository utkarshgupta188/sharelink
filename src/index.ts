// P2P File Sharing Server with Express and Socket.io
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import { OTPManager } from './auth/otpManager';
import { FileManager } from './files/fileManager';
import { P2PManager } from './p2p/p2pManager';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize managers
const otpManager = new OTPManager();
const fileManager = new FileManager();
const p2pManager = new P2PManager(io);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// OTP routes
app.post('/api/otp/generate', (req, res) => {
  const { peerId } = req.body;
  if (!peerId) {
    return res.status(400).json({ error: 'Peer ID is required' });
  }

  try {
    const { token, secret } = otpManager.generateOTP(peerId);
    res.json({ token, secret });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate OTP' });
  }
});

app.post('/api/otp/verify', (req, res) => {
  const { token, peerId } = req.body;
  if (!token || !peerId) {
    return res.status(400).json({ error: 'Token and Peer ID are required' });
  }

  try {
    const isValid = otpManager.verifyOTP(token, peerId);
    if (isValid) {
      // Authenticate the peer in P2P manager
      const peer = p2pManager.getPeer(peerId);
      if (peer) {
        p2pManager.authenticatePeer(io.sockets.sockets.get(peer.socketId)!, peerId, token);
      }
      res.json({ valid: true });
    } else {
      res.status(401).json({ valid: false, error: 'Invalid or expired OTP' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// File routes
app.post('/api/files/upload', upload.single('file'), (req, res) => {
  const { peerId } = req.body;
  if (!req.file || !peerId) {
    return res.status(400).json({ error: 'File and Peer ID are required' });
  }

  try {
    const fileMetadata = fileManager.addFile(req.file, peerId);
    res.json(fileMetadata);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

app.get('/api/files', (req, res) => {
  const files = fileManager.getAllFiles().map(file => ({
    id: file.id,
    originalName: file.originalName,
    size: file.size,
    mimetype: file.mimetype,
    uploadedAt: file.uploadedAt,
    ownerId: file.ownerId
  }));
  res.json({ files });
});

app.get('/api/files/:fileId/download', (req, res) => {
  const { fileId } = req.params;
  const file = fileManager.getFile(fileId);
  
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  const filePath = fileManager.getFilePath(fileId);
  if (!filePath) {
    return res.status(404).json({ error: 'File not available' });
  }

  res.download(filePath, file.originalName);
});

app.delete('/api/files/:fileId', (req, res) => {
  const { fileId } = req.params;
  const { peerId } = req.body;

  if (!peerId) {
    return res.status(400).json({ error: 'Peer ID is required' });
  }

  const deleted = fileManager.deleteFile(fileId, peerId);
  if (deleted) {
    res.json({ success: true });
  } else {
    res.status(403).json({ error: 'Unauthorized or file not found' });
  }
});

// Peer routes
app.get('/api/peers', (req, res) => {
  const peers = p2pManager.getAllPeers()
    .filter(peer => peer.isAuthenticated)
    .map(peer => ({
      id: peer.id,
      username: peer.username,
      connectedAt: peer.connectedAt
    }));
  res.json({ peers });
});

// Socket.io connection handling for WebRTC P2P
const connectedPeers = new Map();

io.on('connection', (socket: any) => {
    console.log('👤 Peer connected:', socket.id);
    connectedPeers.set(socket.id, {
      id: socket.id,
      connectedAt: new Date()
    });

    // Handle file announcements (file stays on peer's device)
    socket.on('announce-file', (data: any) => {
      const { otp, fileName, fileSize, fileType } = data;
      console.log(`📢 File announced by ${socket.id}: ${fileName} (OTP: ${otp})`);
      
      // Update/track file owner with correct socket.id
      // This overwrites any HTTP entry with the actual socket connection
      fileOwners.set(otp, {
        ownerId: socket.id,
        fileName,
        fileSize,
        fileType,
        announcedAt: new Date()
      });
      console.log(`✅ File owner updated to socket.id: ${socket.id}`);
      
      // Notify all other peers about available file
      socket.broadcast.emit('file-available', {
        otp,
        fileName,
        fileSize,
        fileType,
        ownerId: socket.id
      });
    });

    // Handle P2P file requests
    socket.on('request-file', (data: any) => {
      const { otp } = data;
      console.log(`🔍 File request for OTP ${otp} from ${socket.id}`);
      console.log(`📋 Available OTPs: ${Array.from(fileOwners.keys()).join(', ')}`);
      
      const fileInfo = fileOwners.get(otp);
      if (fileInfo) {
        console.log(`✅ Found file info:`, fileInfo);
        // Forward request to file owner
        const ownerSocket = io.sockets.sockets.get(fileInfo.ownerId);
        if (ownerSocket) {
          ownerSocket.emit('file-request-received', {
            otp,
            requesterId: socket.id,
            fileName: fileInfo.fileName
          });
          console.log(`📤 File request forwarded to owner ${fileInfo.ownerId}`);
        } else {
          console.log(`❌ Owner socket ${fileInfo.ownerId} not found`);
          socket.emit('file-request-failed', {
            error: 'File owner is offline'
          });
        }
      } else {
        console.log(`❌ No file found for OTP: ${otp}`);
        socket.emit('file-request-failed', {
          error: 'File not found or OTP expired'
        });
      }
    });

    // Handle file transfer approvals
    socket.on('approve-transfer', (data: any) => {
      const { otp, requesterId } = data;
      console.log(`✅ Transfer approved by ${socket.id} for OTP ${otp}`);
      
      const requesterSocket = io.sockets.sockets.get(requesterId);
      if (requesterSocket) {
        requesterSocket.emit('file-transfer-approved', {
          ownerId: socket.id,
          otp
        });
      }
    });

    // Handle file transfer rejections
    socket.on('reject-transfer', (data: any) => {
      const { otp, requesterId, reason } = data;
      console.log(`❌ Transfer rejected by ${socket.id} for OTP ${otp}: ${reason}`);
      
      const requesterSocket = io.sockets.sockets.get(requesterId);
      if (requesterSocket) {
        requesterSocket.emit('file-transfer-rejected', {
          reason: reason || 'Transfer rejected by owner'
        });
      }
    });

    // WebRTC signaling
    socket.on('webrtc-offer', (data: any) => {
      console.log(`📡 WebRTC offer from ${socket.id} to ${data.targetId}`);
      const targetSocket = io.sockets.sockets.get(data.targetId);
      if (targetSocket) {
        targetSocket.emit('webrtc-offer-received', {
          offer: data.offer,
          senderId: socket.id,
          otp: data.otp
        });
        console.log(`📡 WebRTC offer forwarded to ${data.targetId}`);
      }
    });

    socket.on('webrtc-answer', (data: any) => {
      console.log(`📡 WebRTC answer from ${socket.id} to ${data.targetId}`);
      const targetSocket = io.sockets.sockets.get(data.targetId);
      if (targetSocket) {
        targetSocket.emit('webrtc-answer-received', {
          answer: data.answer,
          senderId: socket.id
        });
        console.log(`📡 WebRTC answer forwarded to ${data.targetId}`);
      }
    });

    socket.on('webrtc-ice-candidate', (data: any) => {
      console.log(`📡 ICE candidate from ${socket.id} to ${data.targetId}`);
      const targetSocket = io.sockets.sockets.get(data.targetId);
      if (targetSocket) {
        targetSocket.emit('webrtc-ice-candidate-received', {
          candidate: data.candidate,
          senderId: socket.id
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('👤 Peer disconnected:', socket.id);
      connectedPeers.delete(socket.id);
      
      // Clean up any file announcements from this peer
      for (const [otp, fileInfo] of fileOwners.entries()) {
        if (fileInfo.ownerId === socket.id) {
          fileOwners.delete(otp);
          console.log(`🧹 Removed file announcement ${otp} from disconnected peer`);
        }
      }
    });
  });

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 P2P File Sharing Server running on port ${PORT}`);
  console.log(`📱 Access the application at: http://localhost:${PORT}`);
  console.log(`🌐 True P2P Mode: Files never stored on server!`);
});
        otp,
        fileName,
        fileSize,
        fileType,
        ownerId: socket.id
      });
    });

    // Handle P2P file requests
    socket.on('request-file', (data: any) => {
      const { otp } = data;
      console.log(`🔍 File request for OTP ${otp} from ${socket.id}`);
      console.log(`📋 Available OTPs: ${Array.from(fileOwners.keys()).join(', ')}`);
      
      const fileInfo = fileOwners.get(otp);
      if (fileInfo) {
        console.log(`✅ Found file info:`, fileInfo);
        // Forward request to file owner
        const ownerSocket = io.sockets.sockets.get(fileInfo.ownerId);
        if (ownerSocket) {
          ownerSocket.emit('file-request-received', {
            otp,
            requesterId: socket.id,
            fileName: fileInfo.fileName
          });
          console.log(`📤 File request forwarded to owner ${fileInfo.ownerId}`);
        } else {
          console.log(`❌ Owner socket ${fileInfo.ownerId} not found`);
          socket.emit('file-request-failed', {
            error: 'File owner is offline'
          });
        }
      } else {
        console.log(`❌ No file found for OTP: ${otp}`);
        socket.emit('file-request-failed', {
          error: 'File not found or OTP expired'
        });
      }
    });

    // Handle file transfer approvals
    socket.on('approve-transfer', (data: any) => {
      const { otp, requesterId } = data;
      console.log(`✅ Transfer approved by ${socket.id} for OTP ${otp}`);
      
      const requesterSocket = io.sockets.sockets.get(requesterId);
      if (requesterSocket) {
        requesterSocket.emit('file-transfer-approved', {
          ownerId: socket.id,
          otp
        });
      }
    });

    // Handle file transfer rejections
    socket.on('reject-transfer', (data: any) => {
      const { otp, requesterId, reason } = data;
      console.log(`❌ Transfer rejected by ${socket.id} for OTP ${otp}: ${reason}`);
      
      const requesterSocket = io.sockets.sockets.get(requesterId);
      if (requesterSocket) {
        requesterSocket.emit('file-transfer-rejected', {
          reason: reason || 'Transfer rejected by owner'
        });
      }
    });

    // WebRTC signaling
    socket.on('webrtc-offer', (data: any) => {
      console.log(`📡 WebRTC offer from ${socket.id} to ${data.targetId}`);
      const targetSocket = io.sockets.sockets.get(data.targetId);
      if (targetSocket) {
        targetSocket.emit('webrtc-offer-received', {
          offer: data.offer,
          senderId: socket.id,
          otp: data.otp
        });
        console.log(`📡 WebRTC offer forwarded to ${data.targetId}`);
      }
    });

    socket.on('webrtc-answer', (data: any) => {
      console.log(`📡 WebRTC answer from ${socket.id} to ${data.targetId}`);
      const targetSocket = io.sockets.sockets.get(data.targetId);
      if (targetSocket) {
        targetSocket.emit('webrtc-answer-received', {
          answer: data.answer,
          senderId: socket.id
        });
        console.log(`📡 WebRTC answer forwarded to ${data.targetId}`);
      }
    });

    socket.on('webrtc-ice-candidate', (data: any) => {
      console.log(`📡 ICE candidate from ${socket.id} to ${data.targetId}`);
      const targetSocket = io.sockets.sockets.get(data.targetId);
      if (targetSocket) {
        targetSocket.emit('webrtc-ice-candidate-received', {
          candidate: data.candidate,
          senderId: socket.id
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('👤 Peer disconnected:', socket.id);
      connectedPeers.delete(socket.id);
      
      // Clean up any file announcements from this peer
      for (const [otp, fileInfo] of fileOwners.entries()) {
        if (fileInfo.ownerId === socket.id) {
          fileOwners.delete(otp);
          console.log(`🧹 Removed file announcement ${otp} from disconnected peer`);
        }
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 P2P File Sharing Server running on port ${PORT}`);
    console.log(`📱 Access the application at: http://localhost:${PORT}`);
    console.log(`🌐 True P2P Mode: Files never stored on server!`);
  });
}

// Check if running in demo mode
if (process.argv.includes('--demo')) {
  runDemo().catch(console.error);
} else {
  startServer().catch(console.error);
}
