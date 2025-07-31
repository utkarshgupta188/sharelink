// Simple entry point for Render deployment
console.log('🚀 Starting P2P File Sharing Server...');
console.log('📂 Current working directory:', process.cwd());
console.log('📁 Files in directory:', require('fs').readdirSync('.'));

// Start the main application
require('./index.js');