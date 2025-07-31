<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# P2P File Sharing Application

This is a peer-to-peer file sharing application with OTP (One-Time Password) authentication built with Node.js, TypeScript, Socket.io, and Express.

## Project Structure
- `src/index.ts` - Main server application
- `src/auth/otpManager.ts` - OTP generation and verification logic
- `src/files/fileManager.ts` - File management and storage
- `src/p2p/p2pManager.ts` - Peer-to-peer connection management
- `public/index.html` - Web-based user interface

## Key Features
- OTP-based authentication for secure file sharing
- Real-time peer discovery using Socket.io
- Simple file upload and download interface
- Peer-to-peer file transfer capabilities

## Development Guidelines
- Use TypeScript for type safety
- Follow async/await patterns for asynchronous operations
- Implement proper error handling and validation
- Keep the interface simple and user-friendly
- Ensure OTP security with proper expiration and validation

## Dependencies
- Express.js for HTTP server
- Socket.io for real-time communication
- Speakeasy for OTP generation
- Multer for file uploads
- UUID for unique identifiers
