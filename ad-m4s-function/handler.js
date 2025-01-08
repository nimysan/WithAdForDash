'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Download file from URL
 */
async function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download: ${res.statusCode}`));
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

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

module.exports.handler = async (event, context) => {
  try {
    // Get target sequence from request
    const targetSequence = parseInt(event.queryStringParameters?.target_sequence, 10);
    if (isNaN(targetSequence)) {
      throw new Error('target_sequence parameter is required and must be a number');
    }

    // Get URL and target sequence from request
    const body = JSON.parse(event.body);
    if (!body.url) {
      throw new Error('url is required in request body');
    }

    // Download m4s file from URL
    console.log('Downloading from:', body.url);
    const m4sData = await downloadFile(body.url);
    
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

    // Return modified m4s data
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      body: modifiedData.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error.message
      })
    };
  }
};

// Local testing function
async function main() {
  if (process.argv.length !== 4) {
    console.error('Usage: node handler.js <m4s_url> <target_sequence>');
    process.exit(1);
  }

  const url = process.argv[2];
  const targetSequence = parseInt(process.argv[3], 10);
  
  // Extract filename from URL
  const urlPath = new URL(url).pathname;
  const filename = path.basename(urlPath);
  const outputFile = `modified_${filename}`;

  try {
    // Create mock Lambda event
    const event = {
      queryStringParameters: {
        target_sequence: targetSequence.toString()
      },
      body: JSON.stringify({
        url: url
      })
    };

    // Call handler
    console.log(`Processing URL: ${url}`);
    console.log(`Target sequence: ${targetSequence}`);
    const result = await module.exports.handler(event, {});

    if (result.statusCode === 200) {
      // Save modified file
      const modifiedData = Buffer.from(result.body, 'base64');
      fs.writeFileSync(outputFile, modifiedData);
      console.log(`\nSuccessfully saved modified file to: ${outputFile}`);
    } else {
      console.error('Error:', JSON.parse(result.body));
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run main if called directly (not imported as module)
if (require.main === module) {
  main();
}
