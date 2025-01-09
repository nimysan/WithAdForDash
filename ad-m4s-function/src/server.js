const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const { parseM4S, parseM4sPath } = require('../lib/parse-m4s');
const { modifyMoofSequence } = require('../lib/modify-m4s');

const app = express();
const port = 3000;

if (cluster.isPrimary) {
  console.log(`Primary process ${process.pid} is running`);

  // Fork workers based on CPU count
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork();
  });

  // Log when a worker connects
  cluster.on('online', (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
  });
} else {

// Add route for M4S requests
app.get('*.m4s', async (req, res) => {
  try {
    // Get target sequence and track ID from path
    const { sn, targetSequence, trackId } = parseM4sPath(req.path);
    console.log(` SN ${sn} Track ID: ${trackId}, Target sequence: ${targetSequence}`);

    

    // Read original m4s file from local path
    const offset = targetSequence%10;
    console.log("offset === "  + offset)
    const originalM4sPath = path.join(__dirname, "..", "assets", "AD001", trackId+'-'+(38304768+offset)+'.m4s');
    console.log('Reading from:', originalM4sPath);
    const m4sData = fs.readFileSync(originalM4sPath);
    
    // Parse original m4s info
    console.log('Original M4S Info:');
    const originalInfo = parseM4S(m4sData);
    console.log('Original sequence number:', originalInfo.moofSequence);
    console.log('Box structure:', originalInfo.boxes.map(b => `${b.type} (${b.size} bytes)`).join(' -> '));

    // Modify m4s with new sequence
    // targetSequence = targetSequence - 38306941;
    const modifiedData = modifyMoofSequence(m4sData, targetSequence);

    // Parse modified m4s info
    console.log('\nModified M4S Info:');
    const modifiedInfo = parseM4S(modifiedData);
    console.log('New sequence number:', modifiedInfo.moofSequence);
    console.log('Box structure:', modifiedInfo.boxes.map(b => `${b.type} (${b.size} bytes)`).join(' -> '));

    // Send response
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(modifiedData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    });
  }
});

// Parse M4S from URL endpoint
app.get('/tool/parsem4s.json', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Download the m4s file
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const m4sData = await new Promise((resolve, reject) => {
      protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download m4s file: ${response.statusCode}`));
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
      }).on('error', reject);
    });

    // Parse the m4s file
    const info = parseM4S(m4sData);
    
    // Send response
    res.json(info);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    });
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('M4S Processing Server');
});

  // Start server in worker process
  app.listen(port, () => {
    console.log(`Worker ${process.pid} is listening on port ${port}`);
  });

  // Handle process termination for workers
  process.on('SIGTERM', () => {
    console.log(`Worker ${process.pid} received SIGTERM, shutting down...`);
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log(`Worker ${process.pid} received SIGINT, shutting down...`);
    process.exit(0);
  });
}
