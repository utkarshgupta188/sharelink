# P2P File Sharing with OTP Authentication

A simple peer-to-peer file sharing application that uses One-Time Passwords (OTP) for secure authentication.

## Features

- 🔐 **OTP Authentication**: Secure file sharing using time-based one-time passwords
- 🤝 **Peer-to-Peer**: Direct file transfers between connected peers
- 📁 **File Management**: Upload, share, and download files easily
- 🌐 **Web Interface**: Simple browser-based user interface
- ⚡ **Real-time**: Live peer discovery and transfer status updates

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the TypeScript project:
   ```bash
   npm run build
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Development Mode

For development with auto-reload:
```bash
npm run dev
```

## How It Works

1. **Upload a File**: Select and upload a file to generate a 6-digit OTP
2. **Share the OTP**: Send the OTP to the person you want to share the file with
3. **Download**: The recipient enters the OTP to verify and download the file
4. **P2P Transfer**: Files can be transferred directly between connected peers

## Project Structure

```
├── src/
│   ├── index.ts                 # Main server application
│   ├── auth/
│   │   └── otpManager.ts        # OTP generation and verification
│   ├── files/
│   │   └── fileManager.ts       # File management and storage
│   └── p2p/
│       └── p2pManager.ts        # P2P connection management
├── public/
│   └── index.html               # Web user interface
├── uploads/                     # File storage directory
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

- `POST /api/generate-otp` - Generate OTP for file sharing
- `POST /api/verify-otp` - Verify OTP and get file info
- `GET /api/files` - List available files

## Socket.io Events

### Client to Server
- `discover-peers` - Find connected peers
- `request-file-transfer` - Request file transfer to peer
- `accept-file-transfer` - Accept incoming file transfer
- `reject-file-transfer` - Reject incoming file transfer

### Server to Client
- `peers-list` - List of available peers
- `file-transfer-request` - Incoming file transfer request
- `transfer-accepted` - File transfer accepted
- `transfer-rejected` - File transfer rejected

## Security Features

- ⏰ **Time-limited OTPs**: OTPs expire after 5 minutes
- 🔄 **One-time use**: Each OTP is unique and time-bound
- 🛡️ **Secure generation**: Uses cryptographically secure random generation
- 🚫 **No permanent storage**: Files and OTPs are not permanently stored

## Deployment

### Local Production Build

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

### Docker Deployment

1. **Build Docker image:**
   ```bash
   docker build -t p2p-file-sharing .
   ```

2. **Run container:**
   ```bash
   docker run -p 3000:3000 p2p-file-sharing
   ```

### Cloud Deployment Options

#### Vercel (Recommended for quick deployment)
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel --prod`
3. Follow the prompts

#### Heroku
1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Deploy: `git push heroku main`

#### Render
1. Connect your GitHub repository to Render
2. The `render.yaml` file will automatically configure the deployment

#### Railway
1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Deploy: `railway up`

#### DigitalOcean App Platform
1. Connect your GitHub repository
2. Choose Node.js environment
3. Use build command: `npm run build`
4. Use run command: `npm start`

### Environment Variables

Set these environment variables in your deployment platform:

- `NODE_ENV=production`
- `PORT=3000` (or as required by your platform)

## Configuration

The application runs on port 3000 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## Development

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-reload

### Technology Stack

- **Backend**: Node.js, Express, TypeScript
- **Real-time Communication**: Socket.io
- **Authentication**: Speakeasy (TOTP)
- **File Handling**: Multer
- **Frontend**: Vanilla JavaScript, HTML, CSS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the port using the `PORT` environment variable
2. **File upload fails**: Check that the `uploads` directory exists and is writable
3. **OTP not working**: Ensure system time is synchronized (OTPs are time-based)

### Support

For issues and questions, please open an issue on the project repository.
