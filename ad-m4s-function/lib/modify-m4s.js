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
 * 修改M4S文件的MOOF序列号
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputPath - 输出文件路径
 * @param {number} newSequence - 新的序列号
 */
function modifyMoofSequence(inputPath, outputPath, newSequence) {
  console.log(`\nModifying MOOF sequence in: ${inputPath}`);
  console.log(`New sequence number: ${newSequence}`);
  console.log('='.repeat(50));

  // 读取输入文件
  const buffer = fs.readFileSync(inputPath);
  const modifiedBuffer = Buffer.from(buffer);
  let offset = 0;
  let modified = false;

  // 遍历所有box
  while (offset < buffer.length) {
    const header = parseBoxHeader(buffer, offset);
    
    if (header.type === 'moof') {
      // 在moof box中查找mfhd box
      let currentOffset = offset + 8;
      while (currentOffset < offset + header.size) {
        const subHeader = parseBoxHeader(buffer, currentOffset);
        if (subHeader.type === 'mfhd') {
          // 修改序列号
          const oldSequence = buffer.readUInt32BE(currentOffset + 12);
          modifiedBuffer.writeUInt32BE(newSequence, currentOffset + 12);
          console.log('Found MOOF box:');
          console.log(`- Old sequence number: ${oldSequence}`);
          console.log(`- New sequence number: ${newSequence}`);
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

  // 写入修改后的文件
  fs.writeFileSync(outputPath, modifiedBuffer);
  console.log(`\nSuccessfully wrote modified file to: ${outputPath}`);
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  if (args.length !== 3) {
    console.error('Usage: node modify-m4s.js <input_file> <output_file> <new_sequence>');
    process.exit(1);
  }

  const [inputFile, outputFile, newSequence] = args;
  
  try {
    modifyMoofSequence(inputFile, outputFile, parseInt(newSequence, 10));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
