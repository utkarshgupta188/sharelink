// Simple P2P File Sharing Server - Production Ready
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? true : "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// File owner management for P2P (files never stored on server)
const fileOwners = new Map();

// Cleanup expired entries every minute
setInterval(() => {
  const now = new Date();
  for (const [otp, owner] of fileOwners.entries()) {
    if (now.getTime() - owner.announcedAt.getTime() > 5 * 60 * 1000) { // 5 minutes
      fileOwners.delete(otp);
      console.log('🧹 Cleaned up expired OTP:', otp);
    }
  }
}, 60000);

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : "*",
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeFiles: fileOwners.size,
    uptime: process.uptime()
  });
});

// File announcement endpoint
app.post('/api/announce-file', (req, res) => {
  try {
    const { fileName, fileSize, fileType } = req.body;
    
    if (!fileName || !fileSize) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: fileName and fileSize are required' 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const ownerId = Math.random().toString(36).substring(2, 15);
    
    fileOwners.set(otp, {
      ownerId,
      fileName,
      fileSize,
      fileType: fileType || 'application/octet-stream',
      announcedAt: new Date()
    });

    console.log(`📢 File announced: ${fileName} (${formatFileSize(fileSize)}) - OTP: ${otp}`);
    
    res.json({ 
      success: true,
      otp, 
      ownerId,
      message: 'File announced successfully' 
    });
  } catch (error) {
    console.error('❌ File announcement error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during file announcement'
    });
  }
});

// Download request endpoint
app.post('/api/request-download', (req, res) => {
  try {
    const { otp, downloaderId } = req.body;
    
    if (!otp) {
      return res.status(400).json({ 
        success: false, 
        error: 'OTP is required' 
      });
    }

    const fileInfo = fileOwners.get(otp);
    if (!fileInfo) {
      return res.status(404).json({ 
        success: false, 
        error: 'Invalid or expired OTP' 
      });
    }

    console.log(`📥 Download requested for: ${fileInfo.fileName} - OTP: ${otp} by ${downloaderId || 'anonymous'}`);
    
    res.json({
      success: true,
      fileName: fileInfo.fileName,
      fileSize: fileInfo.fileSize,
      fileType: fileInfo.fileType,
      message: 'File info retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Download request error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during download request'
    });
  }
});

// Socket.io handling for P2P coordination
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // Handle file owner registration
  socket.on('register-file-owner', (data) => {
    const { otp, ownerId } = data;
    const fileInfo = fileOwners.get(otp);
    
    if (fileInfo && fileInfo.ownerId === ownerId) {
      socket.join(`file-${otp}`);
      socket.fileOTP = otp;
      console.log(`📁 File owner registered: ${socket.id} for OTP: ${otp}`);
      socket.emit('registration-success', { message: 'Registered as file owner' });
    } else {
      socket.emit('registration-error', { message: 'Invalid OTP or owner ID' });
    }
  });

  // Handle download requests
  socket.on('request-file-download', (data) => {
    const { otp } = data;
    const fileInfo = fileOwners.get(otp);
    
    if (!fileInfo) {
      socket.emit('download-error', { message: 'Invalid or expired OTP' });
      return;
    }

    // Join the file room
    socket.join(`file-${otp}`);
    
    // Notify file owner about download request
    socket.to(`file-${otp}`).emit('download-request', {
      downloaderId: socket.id,
      fileName: fileInfo.fileName,
      fileSize: fileInfo.fileSize
    });
    
    socket.fileOTP = otp;
    console.log(`📥 Download request: ${socket.id} for ${fileInfo.fileName}`);
  });

  // WebRTC signaling
  socket.on('webrtc-offer', (data) => {
    const { otp, offer, targetId } = data;
    socket.to(targetId).emit('webrtc-offer', {
      offer,
      senderId: socket.id,
      otp
    });
    console.log(`🔄 WebRTC offer: ${socket.id} -> ${targetId}`);
  });

  socket.on('webrtc-answer', (data) => {
    const { answer, targetId } = data;
    socket.to(targetId).emit('webrtc-answer', {
      answer,
      senderId: socket.id
    });
    console.log(`✅ WebRTC answer: ${socket.id} -> ${targetId}`);
  });

  socket.on('webrtc-ice-candidate', (data) => {
    const { candidate, targetId } = data;
    socket.to(targetId).emit('webrtc-ice-candidate', {
      candidate,
      senderId: socket.id
    });
  });

  // Handle download approval/rejection
  socket.on('approve-download', (data) => {
    const { downloaderId } = data;
    socket.to(downloaderId).emit('download-approved', {
      ownerId: socket.id
    });
    console.log(`✅ Download approved: ${socket.id} -> ${downloaderId}`);
  });

  socket.on('reject-download', (data) => {
    const { downloaderId } = data;
    socket.to(downloaderId).emit('download-rejected', {
      message: 'Download request was rejected by file owner'
    });
    console.log(`❌ Download rejected: ${socket.id} -> ${downloaderId}`);
  });

  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
    
    // If this was a file owner, clean up
    if (socket.fileOTP) {
      const fileInfo = fileOwners.get(socket.fileOTP);
      if (fileInfo) {
        console.log(`🗑️ File owner disconnected, cleaning up OTP: ${socket.fileOTP}`);
        fileOwners.delete(socket.fileOTP);
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 P2P File Sharing Server running on port ${PORT}`);
  console.log(`📱 Access the application at: http://localhost:${PORT}`);
  console.log(`🌐 True P2P Mode: Files never stored on server!`);
});
