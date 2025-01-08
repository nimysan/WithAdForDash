const { parseBoxHeader } = require('./parse-m4s');

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

module.exports = {
  modifyMoofSequence
};
