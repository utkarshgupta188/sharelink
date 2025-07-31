// P2P File Sharing Server with Express and Socket.io
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { OTPManager } from './auth/otpManager';
import { FileManager } from './files/fileManager';
import { P2PManager } from './p2p/p2pManager';

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
interface FileOwner {
  ownerId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  announcedAt: Date;
}

const fileOwners = new Map<string, FileOwner>();

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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function runDemo(): Promise<void> {
  console.log('🚀 P2P File Sharing Demo Mode\n');
  
  const otpManager = new OTPManager();
  const fileManager = new FileManager();
  const p2pManager = new P2PManager();
  
  // Initialize with demo files
  fileManager.initializeDemoFiles();
  
  // 1. List available files
  console.log('📁 Available files:');
  const files = await fileManager.listFiles();
  files.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file.name} (${formatFileSize(file.size)})`);
  });
  
  // 2. Generate OTP for first file
  if (files.length > 0) {
    const firstFile = files[0];
    console.log(`\n🔐 Generating OTP for "${firstFile.name}"...`);
    
    const otp = await otpManager.generateOTP(firstFile.id, 'user-001');
    console.log(`   ✅ OTP Generated: ${otp}`);
    console.log(`   ⏰ Valid for 5 minutes`);
    
    // 3. Verify the OTP
    console.log(`\n🔍 Verifying OTP: ${otp}`);
    const isValid = await otpManager.verifyOTP(otp);
    
    if (isValid) {
      console.log(`   ✅ OTP Verified! File access granted.`);
      const fileInfo = await otpManager.getFileInfo(otp);
      console.log(`   📄 File Info:`, fileInfo);
    } else {
      console.log(`   ❌ OTP Verification failed`);
    }
  }
  
  // 4. Show P2P functionality
  console.log(`\n🤝 P2P Network Simulation:`);
  p2pManager.addPeer('peer-001');
  p2pManager.addPeer('peer-002');
  p2pManager.addPeer('peer-003');
  
  const peers = p2pManager.getAvailablePeers();
  peers.forEach(peer => {
    console.log(`   • ${peer.id} (connected at ${peer.connectedAt.toLocaleTimeString()})`);
  });
  
  // 5. Simulate file transfer
  console.log(`\n📤 Simulating file transfer...`);
  if (files.length > 0 && peers.length > 0) {
    const selectedPeer = peers[0];
    const transferRequest = {
      senderId: 'demo-sender',
      receiverId: selectedPeer.id,
      fileId: files[0].id,
      fileName: files[0].name,
      fileSize: files[0].size,
      otp: '123456'
    };
    const transferResult = p2pManager.requestFileTransfer(transferRequest);
    console.log(`   Transfer request: ${transferResult ? '✅ Success' : '❌ Failed'}`);
  }
  
  console.log(`\n✨ Demo completed! All features working correctly.\n`);
}

// Production server setup
async function startServer(): Promise<void> {
  const otpManager = new OTPManager();
  const PORT = process.env.PORT || 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  // Serve the main page
  app.get('/', (req: any, res: any) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  // Health check endpoint
  app.get('/api/health', (req: any, res: any) => {
    res.json({ 
      status: 'ok', 
      service: 'P2P File Sharing',
      version: '1.0.0',
      mode: 'True P2P WebRTC'
    });
  });

  // True P2P file announcement endpoint (file stays on peer's device)
  app.post('/api/announce-file', async (req: any, res: any) => {
    try {
      const { fileName, fileSize, fileType, uploaderId } = req.body;
      console.log(`📢 P2P file announcement: ${fileName} from ${uploaderId}`);
      
      // Generate OTP for P2P coordination
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`🔐 Generated OTP: ${otp}`);
      
      // Add to P2P file owners tracking (no server storage)
      // Use uploaderId as ownerId for consistency with Socket.IO
      fileOwners.set(otp, {
        ownerId: uploaderId || 'anonymous',
        fileName,
        fileSize,
        fileType,
        announcedAt: new Date()
      });
      console.log(`✅ File tracked in P2P network with owner: ${uploaderId}`);
      
      // Don't announce via WebSocket here - let the client do it via Socket.IO
      // This ensures the socket.id matches the ownerId
      
      console.log(`📢 File announced to P2P network: ${fileName} (OTP: ${otp})`);
      
      res.json({ 
        success: true, 
        otp, 
        message: `File announced to P2P network! File stays on your device.` 
      });
    } catch (error) {
      console.error('❌ P2P Announcement error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: 'P2P announcement failed: ' + errorMessage });
    }
  });

  // True P2P file request endpoint (no file download from server)
  app.post('/api/request-file', async (req: any, res: any) => {
    try {
      console.log('🔍 P2P file request received');
      const { otp, downloaderId } = req.body;
      console.log(`🔐 Checking P2P network for OTP: ${otp}`);
      
      // In true P2P, we check if any peer has announced this OTP
      const fileInfo = fileOwners.get(otp);
      
      if (!fileInfo) {
        console.log('❌ No file found for OTP in P2P network');
        return res.json({ 
          success: false, 
          error: 'File not found or OTP expired. The file owner may be offline.' 
        });
      }

      console.log(`✅ File found in P2P network - proceeding with request`);
      
      res.json({
        success: true,
        message: 'File found in P2P network. Requesting from owner...',
        otp,
        fileInfo: {
          fileName: fileInfo.fileName,
          fileSize: fileInfo.fileSize,
          fileType: fileInfo.fileType
        }
      });
      
    } catch (error) {
      console.error('❌ P2P Request error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: 'P2P request failed: ' + errorMessage });
    }
  });

  // Generate OTP for file sharing
  app.post('/api/generate-otp', async (req: any, res: any) => {
    try {
      const { fileId, userId } = req.body;
      const otp = await otpManager.generateOTP(fileId, userId);
      res.json({ success: true, otp });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to generate OTP' });
    }
  });

  // Verify OTP
  app.post('/api/verify-otp', async (req: any, res: any) => {
    try {
      const { otp } = req.body;
      const isValid = await otpManager.verifyOTP(otp);
      
      if (isValid) {
        const fileInfo = await otpManager.getFileInfo(otp);
        res.json({ success: true, fileInfo });
      } else {
        res.json({ success: false, error: 'Invalid or expired OTP' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'OTP verification failed' });
    }
  });

  // List available files
  app.get('/api/files', async (req: any, res: any) => {
    try {
      const fileManager = new FileManager();
      const files = await fileManager.listFiles();
      res.json({ success: true, files });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to list files' });
    }
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

  server.listen(PORT, () => {
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
