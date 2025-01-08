#!/usr/bin/env node
'use strict';

import fs from 'fs';
import path from 'path';

/**
 * 解析box的大小和类型
 * @param {Buffer} buffer - 数据buffer
 * @param {number} offset - 起始位置
 * @returns {Object} box信息
 */
function parseBoxHeader(buffer, offset) {
  const size = buffer.readUInt32BE(offset);
  const type = buffer.toString('utf8', offset + 4, offset + 8);
  const largeSize = size === 1 ? buffer.readBigUInt64BE(offset + 8) : BigInt(size);
  return { size: Number(largeSize), type };
}

/**
 * 解析styp box (Segment Type Box)
 * @param {Buffer} buffer - 数据buffer
 * @param {number} offset - 起始位置
 * @param {number} size - box大小
 */
function parseStypBox(buffer, offset, size) {
  const majorBrand = buffer.toString('utf8', offset + 8, offset + 12);
  const minorVersion = buffer.readUInt32BE(offset + 12);
  const compatibleBrands = [];
  
  for (let i = 16; i < size; i += 4) {
    compatibleBrands.push(buffer.toString('utf8', offset + i, offset + i + 4));
  }
  
  console.log('\n=== Segment Type Box (styp) ===');
  console.log('Major Brand:', majorBrand);
  console.log('Minor Version:', minorVersion);
  console.log('Compatible Brands:', compatibleBrands.join(', '));
}

/**
 * 解析sidx box (Segment Index Box)
 * @param {Buffer} buffer - 数据buffer
 * @param {number} offset - 起始位置
 * @param {number} size - box大小
 */
function parseSidxBox(buffer, offset, size) {
  const version = buffer.readUInt8(offset + 8);
  const referenceID = buffer.readUInt32BE(offset + 12);
  const timescale = buffer.readUInt32BE(offset + 16);
  
  console.log('\n=== Segment Index Box (sidx) ===');
  console.log('Version:', version);
  console.log('Reference ID:', referenceID);
  console.log('Timescale:', timescale);
  
  if (version === 0) {
    const earliestPTS = buffer.readUInt32BE(offset + 20);
    const firstOffset = buffer.readUInt32BE(offset + 24);
    console.log('Earliest PTS:', earliestPTS);
    console.log('First Offset:', firstOffset);
  } else {
    const earliestPTS = buffer.readBigUInt64BE(offset + 20);
    const firstOffset = buffer.readBigUInt64BE(offset + 28);
    console.log('Earliest PTS:', earliestPTS.toString());
    console.log('First Offset:', firstOffset.toString());
  }
}

/**
 * 解析ftyp box
 * @param {Buffer} buffer - 数据buffer
 * @param {number} offset - 起始位置
 * @param {number} size - box大小
 */
function parseFtypBox(buffer, offset, size) {
  const majorBrand = buffer.toString('utf8', offset + 8, offset + 12);
  const minorVersion = buffer.readUInt32BE(offset + 12);
  const compatibleBrands = [];
  
  for (let i = 16; i < size; i += 4) {
    compatibleBrands.push(buffer.toString('utf8', offset + i, offset + i + 4));
  }
  
  console.log('\n=== File Type Box (ftyp) ===');
  console.log('Major Brand:', majorBrand);
  console.log('Minor Version:', minorVersion);
  console.log('Compatible Brands:', compatibleBrands.join(', '));
}

/**
 * 解析moof box的基本信息
 * @param {Buffer} buffer - 数据buffer
 * @param {number} offset - 起始位置
 * @param {number} size - box大小
 */
function parseMoofBox(buffer, offset, size) {
  console.log('\n=== Movie Fragment Box (moof) ===');
  console.log('Size:', size);
  
  // 解析mfhd (movie fragment header)
  let currentOffset = offset + 8;
  while (currentOffset < offset + size) {
    const header = parseBoxHeader(buffer, currentOffset);
    if (header.type === 'mfhd') {
      const sequenceNumber = buffer.readUInt32BE(currentOffset + 12);
      console.log('Fragment Sequence Number:', sequenceNumber);
    }
    currentOffset += header.size;
  }
}

/**
 * 解析moov box的基本信息
 * @param {Buffer} buffer - 数据buffer
 * @param {number} offset - 起始位置
 * @param {number} size - box大小
 */
function parseMoovBox(buffer, offset, size) {
  console.log('\n=== Movie Box (moov) ===');
  console.log('Size:', size);
  
  // 遍历子box
  let currentOffset = offset + 8;
  while (currentOffset < offset + size) {
    const header = parseBoxHeader(buffer, currentOffset);
    console.log('Found sub-box:', header.type);
    currentOffset += header.size;
  }
}

/**
 * 解析m4s文件
 * @param {string} filePath - 文件路径
 */
function parseM4S(filePath) {
  console.log(`\nParsing file: ${filePath}`);
  console.log('='.repeat(50));
  
  const buffer = fs.readFileSync(filePath);
  let offset = 0;
  
  while (offset < buffer.length) {
    const header = parseBoxHeader(buffer, offset);
    
    switch (header.type) {
      case 'ftyp':
        parseFtypBox(buffer, offset, header.size);
        break;
      case 'styp':
        parseStypBox(buffer, offset, header.size);
        break;
      case 'sidx':
        parseSidxBox(buffer, offset, header.size);
        break;
      case 'moov':
        parseMoovBox(buffer, offset, header.size);
        break;
      case 'moof':
        parseMoofBox(buffer, offset, header.size);
        break;
      case 'mdat':
        console.log('\n=== Media Data Box (mdat) ===');
        console.log('Size:', header.size);
        console.log('Contains encoded media data (audio/video)');
        break;
      default:
        console.log(`\n=== Unknown Box (${header.type}) ===`);
        console.log('Size:', header.size);
    }
    
    offset += header.size;
  }
}

// 创建表格行
function createTableRow(data) {
  const columns = [
    data.filename.padEnd(30),
    data.stypMajorBrand.padEnd(10),
    data.stypMinorVersion.toString().padEnd(8),
    data.sidxVersion.toString().padEnd(8),
    data.sidxReferenceID.toString().padEnd(8),
    data.sidxTimescale.toString().padEnd(10),
    data.sidxEarliestPTS.toString().padEnd(15),
    data.moofSize.toString().padEnd(8),
    data.moofSequence.toString().padEnd(10),
    data.mdatSize.toString().padEnd(8)
  ];
  return columns.join(' | ');
}

// 主函数
function main() {
  const m4sDir = path.join(process.cwd(), 'm4s');
  
  try {
    const files = fs.readdirSync(m4sDir)
      .filter(file => file.endsWith('.m4s'))
      .map(file => path.join(m4sDir, file));
    
    if (files.length === 0) {
      console.log('No m4s files found in the m4s directory');
      return;
    }

    // 打印表头
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

    // 解析每个文件并收集数据
    files.forEach(filePath => {
      const buffer = fs.readFileSync(filePath);
      let offset = 0;
      const data = {
        filename: path.basename(filePath),
        stypMajorBrand: '',
        stypMinorVersion: 0,
        sidxVersion: 0,
        sidxReferenceID: 0,
        sidxTimescale: 0,
        sidxEarliestPTS: 0,
        moofSize: 0,
        moofSequence: 0,
        mdatSize: 0
      };

      while (offset < buffer.length) {
        const header = parseBoxHeader(buffer, offset);
        
        switch (header.type) {
          case 'styp':
            data.stypMajorBrand = buffer.toString('utf8', offset + 8, offset + 12);
            data.stypMinorVersion = buffer.readUInt32BE(offset + 12);
            break;
          case 'sidx':
            data.sidxVersion = buffer.readUInt8(offset + 8);
            data.sidxReferenceID = buffer.readUInt32BE(offset + 12);
            data.sidxTimescale = buffer.readUInt32BE(offset + 16);
            if (data.sidxVersion === 0) {
              data.sidxEarliestPTS = buffer.readUInt32BE(offset + 20);
            } else {
              data.sidxEarliestPTS = buffer.readBigUInt64BE(offset + 20);
            }
            break;
          case 'moof':
            data.moofSize = header.size;
            let currentOffset = offset + 8;
            while (currentOffset < offset + header.size) {
              const subHeader = parseBoxHeader(buffer, currentOffset);
              if (subHeader.type === 'mfhd') {
                data.moofSequence = buffer.readUInt32BE(currentOffset + 12);
              }
              currentOffset += subHeader.size;
            }
            break;
          case 'mdat':
            data.mdatSize = header.size;
            break;
        }
        
        offset += header.size;
      }

      console.log(createTableRow(data));
    });
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('m4s directory not found');
    } else {
      console.error('Error parsing m4s files:', error);
    }
  }
}

main();
