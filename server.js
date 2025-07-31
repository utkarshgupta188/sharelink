// Entry point for Render deployment
const path = require('path');

// Ensure we're in the correct directory
console.log('Current working directory:', process.cwd());
console.log('Looking for dist/index.js at:', path.resolve('./dist/index.js'));

try {
  require('./dist/index.js');
} catch (error) {
  console.error('Failed to load dist/index.js:', error.message);
  console.log('Directory contents:');
  const fs = require('fs');
  try {
    console.log('Root:', fs.readdirSync('.').join(', '));
    if (fs.existsSync('./dist')) {
      console.log('Dist:', fs.readdirSync('./dist').join(', '));
    } else {
      console.log('dist directory does not exist');
    }
  } catch (dirError) {
    console.error('Error reading directories:', dirError.message);
  }
  process.exit(1);
}
