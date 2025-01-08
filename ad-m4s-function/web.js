import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { fileURLToPath } from 'url';

// ...
// (其他函数定义保持不变)
// ...

/**
 * Process M4S request
 */
async function processM4sRequest(reqPath) {
  try {
    // Get target sequence and track ID from path
    const { targetSequence, trackId } = parseM4sPath(reqPath);
    console.log(`Track ID: ${trackId}, Target sequence: ${targetSequence}`);

    // Get ad content URL from environment variable
    const adContentUrl = process.env.ad_content;
    if (!adContentUrl) {
      throw new Error('ad_content environment variable is required');
    }

    // Download m4s file from URL
    console.log('Downloading from:', adContentUrl);
    const m4sData = await downloadFile(adContentUrl);
    
    // Parse original m4s info
    console.log('Original M4S Info:');
    const originalInfo = parseM4S(m4sData);
    console.log('Original sequence number:', originalInfo.moofSequence);
    console.log('Box structure:', originalInfo.boxes.map(b => `${b.type} (${b.size} bytes)`).join(' -> '));

    // Modify m4s with new sequence
    const modifiedData = modifyMoofSequence(m4sData, targetSequence);

    // Parse modified m4s info
    console.log('\nModified M4S Info:');
    const modifiedInfo = parseM4S(modifiedData);
    console.log('New sequence number:', modifiedInfo.moofSequence);
    console.log('Box structure:', modifiedInfo.boxes.map(b => `${b.type} (${b.size} bytes)`).join(' -> '));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      data: modifiedData
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      data: Buffer.from(JSON.stringify({
        message: 'Internal Server Error',
        error: error.message
      }))
    };
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  if (req.method === 'GET' && req.url.endsWith('.m4s')) {
    const result = await processM4sRequest(req.url);
    
    // Set response headers
    res.statusCode = result.statusCode;
    Object.entries(result.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Send response
    res.end(result.data);
  } else {
    // Return 404 for non-m4s requests
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

// Start server
const PORT = 80;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EACCES') {
    console.error(`Port ${PORT} requires elevated privileges`);
  } else if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});