# P2P File Sharing - Render Deployment Guide

## Why Render is Better than Vercel for This App

✅ **Render Advantages:**
- Persistent Node.js server (always running)
- Full WebSocket and Socket.IO support
- Stateful connections for P2P coordination
- Real-time file sharing capabilities

❌ **Vercel Limitations:**
- Serverless functions only (no persistent state)
- No WebSocket support
- Socket.IO fails completely
- Cannot maintain peer connections

## Deployment Steps

### 1. Push Code to GitHub
```bash
git init
git add .
git commit -m "P2P file sharing app with Socket.IO"
git branch -M main
git remote add origin https://github.com/yourusername/p2p-file-sharing.git
git push -u origin main
```

### 2. Deploy on Render
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Use these settings:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Auto-Deploy**: Yes

### 3. Environment Variables
Render will automatically set:
- PORT=10000 (configured in render.yaml)
- NODE_ENV=production

## Testing Locally

Run locally to test Socket.IO functionality:
```bash
npm start
```

Then open: http://localhost:3000

## Expected Results on Render

✅ Real-time Socket.IO connections
✅ WebRTC P2P file transfers
✅ Persistent peer discovery
✅ File transfer approvals working
✅ No connection errors

The app should work perfectly on Render since it supports full Node.js servers with persistent connections!
