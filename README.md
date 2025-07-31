# P2P File Sharing Application

A secure peer-to-peer file sharing application with OTP (One-Time Password) authentication built with Node.js, TypeScript, Socket.io, and Express.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

## 🚀 Features

- 🔐 OTP-based authentication for secure access
- 📁 File upload and download functionality
- 👥 Real-time peer discovery and connection
- 🔄 P2P file sharing capabilities
- 🌐 Web-based user interface
- ☁️ Render deployment ready

## 📋 Quick Start

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/p2p-file-sharing.git
   cd p2p-file-sharing
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   Open http://localhost:3000 in your browser

### Production Build

```bash
npm run build
npm start
```

## 🌐 Deployment

### Deploy to Render

1. **Automatic Deployment:**
   - Fork this repository
   - Connect your GitHub repository to Render
   - Render will automatically detect the `render.yaml` configuration
   - The app will build and deploy automatically

2. **Manual Configuration:**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node.js 18+

### Deploy to Other Platforms

The application is containerizable and can be deployed to:
- Heroku
- Railway
- DigitalOcean App Platform
- AWS Elastic Beanstalk

## 📱 How to Use

1. **Register as a Peer:**
   - Enter your username and click "Register as Peer"
   - You'll receive a unique Peer ID

2. **Authenticate:**
   - An OTP will be generated automatically
   - Enter the OTP to authenticate (valid for 5 minutes)

3. **Upload Files:**
   - Select a file and click "Upload File"
   - Files are stored securely on the server

4. **Share & Download:**
   - View all available files in the file list
   - Download files from other authenticated peers
   - See connected peers in real-time

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/otp/generate` | Generate OTP for peer |
| POST | `/api/otp/verify` | Verify OTP |
| POST | `/api/files/upload` | Upload file |
| GET | `/api/files` | List all files |
| GET | `/api/files/:id/download` | Download file |
| GET | `/api/peers` | List connected peers |
| GET | `/health` | Health check |

## 🛠️ Technologies Used

- **Backend**: Node.js, Express.js, TypeScript
- **Real-time**: Socket.io
- **Authentication**: Speakeasy (OTP)
- **File Handling**: Multer
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Deployment**: Render, GitHub Actions

## 🔒 Security Features

- OTP-based authentication with 5-minute expiration
- One-time use OTPs
- Peer-to-peer verification
- File access control by owner
- Secure file storage
- CORS protection

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Issues

If you encounter any issues, please [create an issue](https://github.com/YOUR_USERNAME/p2p-file-sharing/issues) on GitHub.

## ⭐ Support

If you like this project, please give it a ⭐ on GitHub!
