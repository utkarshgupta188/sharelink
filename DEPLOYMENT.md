# 🚀 P2P File Sharing - Deployment Guide

## Quick Deployment Options

### Option 1: One-Click Local Deployment
**Windows:** Double-click `deploy.bat`
**Linux/Mac:** Run `./deploy.sh`

### Option 2: Manual Local Deployment
```bash
npm install
npm run build
npm start
```

### Option 3: Docker Deployment
```bash
docker build -t p2p-file-sharing .
docker run -p 3000:3000 p2p-file-sharing
```

## Cloud Deployment

### 🟦 Vercel (Easiest - Recommended)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Deploy automatically with zero configuration!

### 🟪 Heroku
1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-p2p-app`
4. Deploy: `git push heroku main`

### 🟨 Railway
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy with one click

### 🟩 Render
1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Use the included `render.yaml` configuration

### 🔵 DigitalOcean App Platform
1. Go to DigitalOcean Apps
2. Connect your GitHub repository
3. Choose Node.js environment
4. Build: `npm run build`, Run: `npm start`

## Features After Deployment

✅ **OTP Authentication** - Secure 6-digit codes
✅ **Real-time P2P** - Live peer discovery
✅ **File Upload/Download** - Drag & drop interface
✅ **WebSocket Support** - Real-time communication
✅ **Mobile Responsive** - Works on all devices
✅ **Production Ready** - Optimized and secure

## Environment Variables

Set these in your hosting platform:
- `NODE_ENV=production`
- `PORT=3000` (or as required)

## Security Notes

- OTPs expire after 5 minutes
- Files are stored temporarily in memory
- CORS enabled for cross-origin requests
- WebSocket connections are secured

## Performance

- Supports files up to 10MB
- Real-time peer discovery
- Optimized TypeScript build
- Gzip compression enabled

## Monitoring

The app includes:
- Health check endpoint at `/`
- Console logging for debugging
- Error handling for all API endpoints

## Support

If you encounter issues:
1. Check Node.js version (>=16.0.0)
2. Ensure all dependencies are installed
3. Check console logs for errors
4. Verify PORT environment variable

**Your P2P File Sharing app is ready to deploy! 🎉**
