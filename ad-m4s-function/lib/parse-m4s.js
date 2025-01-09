/**
 * Parse box header
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
 * Parse styp box (Segment Type Box)
 * @param {Buffer} buffer - 数据buffer
 * @param {number} offset - 起始位置
 * @param {number} size - box大小
 * @returns {Object} styp box信息
 */
function parseStypBox(buffer, offset, size) {
  const majorBrand = buffer.toString('utf8', offset + 8, offset + 12);
  const minorVersion = buffer.readUInt32BE(offset + 12);
  const compatibleBrands = [];
  
  for (let i = 16; i < size; i += 4) {
    compatibleBrands.push(buffer.toString('utf8', offset + i, offset + i + 4));
  }
  
  return {
    majorBrand,
    minorVersion,
    compatibleBrands
  };
}

/**
 * Parse sidx box (Segment Index Box)
 * @param {Buffer} buffer - 数据buffer
 * @param {number} offset - 起始位置
 * @param {number} size - box大小
 * @returns {Object} sidx box信息
 */
function parseSidxBox(buffer, offset, size) {
  const version = buffer.readUInt8(offset + 8);
  const referenceID = buffer.readUInt32BE(offset + 12);
  const timescale = buffer.readUInt32BE(offset + 16);
  
  let earliestPTS;
  if (version === 0) {
    earliestPTS = buffer.readUInt32BE(offset + 20);
  } else {
    earliestPTS = buffer.readBigUInt64BE(offset + 20);
  }
  
  return {
    version,
    referenceID,
    timescale,
    earliestPTS: earliestPTS.toString()
  };
}

/**
 * Parse ftyp box
 * @param {Buffer} buffer - 数据buffer
 * @param {number} offset - 起始位置
 * @param {number} size - box大小
 * @returns {Object} ftyp box信息
 */
function parseFtypBox(buffer, offset, size) {
  const majorBrand = buffer.toString('utf8', offset + 8, offset + 12);
  const minorVersion = buffer.readUInt32BE(offset + 12);
  const compatibleBrands = [];
  
  for (let i = 16; i < size; i += 4) {
    compatibleBrands.push(buffer.toString('utf8', offset + i, offset + i + 4));
  }
  
  return {
    majorBrand,
    minorVersion,
    compatibleBrands
  };
}

/**
 * Parse moof box
 * @param {Buffer} buffer - 数据buffer
 * @param {number} offset - 起始位置
 * @param {number} size - box大小
 * @returns {Object} moof box信息
 */
function parseMoofBox(buffer, offset, size) {
  let sequenceNumber = null;
  let currentOffset = offset + 8;
  
  while (currentOffset < offset + size) {
    const header = parseBoxHeader(buffer, currentOffset);
    if (header.type === 'mfhd') {
      sequenceNumber = buffer.readUInt32BE(currentOffset + 12);
      break;
    }
    currentOffset += header.size;
  }
  
  return {
    size,
    sequenceNumber
  };
}

/**
 * Parse moov box
 * @param {Buffer} buffer - 数据buffer
 * @param {number} offset - 起始位置
 * @param {number} size - box大小
 * @returns {Object} moov box信息
 */
function parseMoovBox(buffer, offset, size) {
  const subBoxes = [];
  let currentOffset = offset + 8;
  
  while (currentOffset < offset + size) {
    const header = parseBoxHeader(buffer, currentOffset);
    subBoxes.push(header.type);
    currentOffset += header.size;
  }
  
  return {
    size,
    subBoxes
  };
}

/**
 * Parse M4S file and return box information
 * @param {Buffer} buffer - M4S文件buffer
 * @returns {Object} 解析结果
 */
function parseM4S(buffer) {
  const info = {
    boxes: [],
    moofSequence: null,
    details: {}
  };
  
  let offset = 0;
  while (offset < buffer.length) {
    const header = parseBoxHeader(buffer, offset);
    info.boxes.push({
      type: header.type,
      size: header.size
    });
    
    switch (header.type) {
      case 'ftyp':
        info.details.ftyp = parseFtypBox(buffer, offset, header.size);
        break;
      case 'styp':
        info.details.styp = parseStypBox(buffer, offset, header.size);
        break;
      case 'sidx':
        info.details.sidx = parseSidxBox(buffer, offset, header.size);
        break;
      case 'moov':
        info.details.moov = parseMoovBox(buffer, offset, header.size);
        break;
      case 'moof':
        const moofInfo = parseMoofBox(buffer, offset, header.size);
        info.moofSequence = moofInfo.sequenceNumber;
        info.details.moof = moofInfo;
        break;
      case 'mdat':
        info.details.mdat = { size: header.size };
        break;
    }
    
    offset += header.size;
  }
  
  return info;
}

/**
 * Parse path to extract track ID and target sequence
 * @param {string} path - M4S文件路径
 * @returns {Object} 解析结果
 */
function parseM4sPath(path) {
  // Handle both formats:
  // 1. /sn-number/trackId-sequence.m4s
  // 2. /trackId-sequence.m4s
  const snMatch = path.match(/\/([^/]+)\/(\d+)-(\d+)\.m4s$/);
  if (snMatch) {
    return {
      sn: snMatch[1],
      trackId: parseInt(snMatch[2], 10),
      targetSequence: parseInt(snMatch[3], 10)
    };
  }

  const simpleMatch = path.match(/(\d+)-(\d+)\.m4s$/);
  if (simpleMatch) {
    return {
      trackId: parseInt(simpleMatch[1], 10),
      targetSequence: parseInt(simpleMatch[2], 10)
    };
  }

  throw new Error('Invalid m4s path format');
}

/**
 * Create table row for M4S analysis
 * @param {Object} data - M4S文件分析数据
 * @returns {string} 表格行
 */
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

module.exports = {
  parseBoxHeader,
  parseStypBox,
  parseSidxBox,
  parseFtypBox,
  parseMoofBox,
  parseMoovBox,
  parseM4S,
  parseM4sPath,
  createTableRow
};
