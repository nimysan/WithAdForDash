const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const app = express();
const port = 3000;

/**
 * Parse box header
 */
function parseBoxHeader(buffer, offset) {
  const size = buffer.readUInt32BE(offset);
  const type = buffer.toString('utf8', offset + 4, offset + 8);
  const largeSize = size === 1 ? buffer.readBigUInt64BE(offset + 8) : BigInt(size);
  return { size: Number(largeSize), type };
}

/**
 * Parse M4S file and return box information
 */
function parseM4S(buffer) {
  const info = {
    boxes: [],
    moofSequence: null
  };
  
  let offset = 0;
  while (offset < buffer.length) {
    const header = parseBoxHeader(buffer, offset);
    info.boxes.push({
      type: header.type,
      size: header.size
    });
    
    if (header.type === 'moof') {
      // Parse moof box to get sequence number
      let currentOffset = offset + 8;
      while (currentOffset < offset + header.size) {
        const subHeader = parseBoxHeader(buffer, currentOffset);
        if (subHeader.type === 'mfhd') {
          info.moofSequence = buffer.readUInt32BE(currentOffset + 12);
          break;
        }
        currentOffset += subHeader.size;
      }
    }
    
    offset += header.size;
  }
  
  return info;
}

/**
 * Modify MOOF sequence in M4S buffer
 */
function modifyMoofSequence(buffer, newSequence) {
  const modifiedBuffer = Buffer.from(buffer);
  let offset = 0;
  let modified = false;

  while (offset < buffer.length) {
    const header = parseBoxHeader(buffer, offset);
    
    if (header.type === 'moof') {
      let currentOffset = offset + 8;
      while (currentOffset < offset + header.size) {
        const subHeader = parseBoxHeader(buffer, currentOffset);
        if (subHeader.type === 'mfhd') {
          modifiedBuffer.writeUInt32BE(newSequence, currentOffset + 12);
          modified = true;
          break;
        }
        currentOffset += subHeader.size;
      }
    }
    
    offset += header.size;
  }

  if (!modified) {
    throw new Error('No MOOF box found in the file');
  }

  return modifiedBuffer;
}

/**
 * Parse path to extract track ID and target sequence
 * Example: "/AD001/chunk-stream2-86293.m4s" -> { trackId: 2, targetSequence: 86293 }
 */
function parseM4sPath(path) {
  const match = path.match(/(\d+)-(\d+)\.m4s$/);
  if (!match) {
    throw new Error('Invalid m4s path format');
  }
  return {
    trackId: parseInt(match[1], 10),
    targetSequence: parseInt(match[2], 10)
  };
}

// Add route for M4S requests
app.get('*.m4s', async (req, res) => {
  try {
    // Get target sequence and track ID from path
    const { targetSequence, trackId } = parseM4sPath(req.path);
    console.log(`Track ID: ${trackId}, Target sequence: ${targetSequence}`);

    

    // Read original m4s file from local path
    const offset = targetSequence%10;
    console.log("offset === "  + offset)
    const originalM4sPath = path.join(__dirname,"AD001" ,trackId+'-'+(38304768+offset)+'.m4s');
    console.log('Reading from:', originalM4sPath);
    const m4sData = fs.readFileSync(originalM4sPath);
    
    // Parse original m4s info
    console.log('Original M4S Info:');
    const originalInfo = parseM4S(m4sData);
    console.log('Original sequence number:', originalInfo.moofSequence);
    console.log('Box structure:', originalInfo.boxes.map(b => `${b.type} (${b.size} bytes)`).join(' -> '));

    // Modify m4s with new sequence
    // targetSequence = targetSequence - 38306941;
    const modifiedData = modifyMoofSequence(m4sData, targetSequence - 38306941);

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

// Default route
app.get('/', (req, res) => {
  res.send('M4S Processing Server');
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  process.exit(0);
});
