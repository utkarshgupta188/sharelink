# Deploy to Render

## Quick Deployment Steps:

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Render deployment"
   git push origin main
   ```

2. **Deploy on Render:**
   - Go to [render.com](https://render.com)
   - Connect your GitHub repository
   - Choose "Web Service"
   - Render will automatically detect the `render.yaml` file

3. **Configuration:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: `Node`
   - Port: `10000` (automatically set)

## Why Render works better than Vercel:

✅ **Persistent connections** - WebSocket/Socket.IO works properly
✅ **Always-on server** - Not serverless limitations
✅ **Better WebRTC support** - Real-time connections stay alive
✅ **File transfer friendly** - No request timeouts for large transfers

## Debugging Production Issues:

1. Check Render logs for connection errors
2. Verify Socket.IO connects in browser console
3. Test WebRTC ICE candidate exchange
4. Monitor network tab for failed requests

## Production URLs:
- Your app will be at: `https://your-app-name.onrender.com`
- Health check: `https://your-app-name.onrender.com/api/health`
