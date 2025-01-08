#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseM4S } = require('../lib/parse-m4s');

function createTableRow(data) {
  const columns = [
    data.filename.padEnd(30),
    (data.styp?.majorBrand || '').padEnd(10),
    (data.styp?.minorVersion || '0').toString().padEnd(8),
    (data.sidx?.version || '0').toString().padEnd(8),
    (data.sidx?.referenceID || '0').toString().padEnd(8),
    (data.sidx?.timescale || '0').toString().padEnd(10),
    (data.sidx?.earliestPTS || '0').toString().padEnd(15),
    (data.moof?.size || '0').toString().padEnd(8),
    (data.moofSequence || '0').toString().padEnd(10),
    (data.mdat?.size || '0').toString().padEnd(8)
  ];
  return columns.join(' | ');
}

function printTableHeader() {
  console.log('\nM4S File Analysis Table');
  console.log('='.repeat(120));
  console.log([
    'Filename'.padEnd(30),
    'STYP Brand'.padEnd(10),
    'STYP Ver'.padEnd(8),
    'SIDX Ver'.padEnd(8),
    'SIDX ID'.padEnd(8),
    'Timescale'.padEnd(10),
    'Earliest PTS'.padEnd(15),
    'MOOF Sz'.padEnd(8),
    'MOOF Seq'.padEnd(10),
    'MDAT Sz'.padEnd(8)
  ].join(' | '));
  console.log('-'.repeat(120));
}

function main() {
  const assetsDir = path.join(__dirname, '..', 'assets');
  
  try {
    // Recursively find all m4s files in assets directory
    const m4sFiles = [];
    function findM4sFiles(dir) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          findM4sFiles(filePath);
        } else if (file.endsWith('.m4s')) {
          m4sFiles.push(filePath);
        }
      });
    }
    
    findM4sFiles(assetsDir);
    
    if (m4sFiles.length === 0) {
      console.log('No m4s files found in the assets directory');
      return;
    }

    printTableHeader();

    // Parse and display info for each file
    m4sFiles.forEach(filePath => {
      const buffer = fs.readFileSync(filePath);
      const info = parseM4S(buffer);
      
      const data = {
        filename: path.basename(filePath),
        ...info.details,
        moofSequence: info.moofSequence
      };

      console.log(createTableRow(data));
    });
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('Assets directory not found');
    } else {
      console.error('Error parsing m4s files:', error);
    }
    process.exit(1);
  }
}

main();
