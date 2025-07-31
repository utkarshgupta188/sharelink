#!/bin/bash
echo "Current working directory: $(pwd)"
echo "Contents of current directory:"
ls -la
echo "Contents of dist directory:"
ls -la dist/ || echo "dist directory not found"
echo "Looking for index.js:"
find . -name "index.js" -type f
echo "Starting application..."
node dist/index.js
