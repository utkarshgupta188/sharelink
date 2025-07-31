@echo off
echo 🚀 P2P File Sharing - Deployment Script
echo ========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Build the application
echo 🔨 Building application...
npm run build

REM Start the application
echo 🎉 Build complete! Starting application...
echo 📱 Your P2P File Sharing app will be available at:
echo    http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

npm start
