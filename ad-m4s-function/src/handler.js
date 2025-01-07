import axios from 'axios';

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
 * @param {Buffer} buffer - 输入buffer
 * @param {number} newSequence - 新的序列号
 * @returns {Buffer} 修改后的buffer
 */
function modifyMoofSequence(buffer, newSequence) {
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

export const handler = async (event) => {
  try {
    // 解析请求参数
    const body = JSON.parse(event.body);
    const { ad_content, target_segment } = body;

    if (!ad_content || !target_segment) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing required parameters: ad_content or target_segment'
        })
      };
    }

    // 下载M4S文件
    const response = await axios.get(ad_content, {
      responseType: 'arraybuffer'
    });

    // 修改segment number
    const buffer = Buffer.from(response.data);
    const modifiedBuffer = modifyMoofSequence(buffer, target_segment);

    // 返回修改后的文件
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="modified.m4s"'
      },
      body: modifiedBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};
