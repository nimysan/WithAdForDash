import json
import struct
import requests
from base64 import b64encode

def parse_box_header(buffer, offset):
    """
    解析box的大小和类型
    Args:
        buffer (bytes): 数据buffer
        offset (int): 起始位置
    Returns:
        dict: box信息
    """
    size = struct.unpack('>I', buffer[offset:offset+4])[0]
    box_type = buffer[offset+4:offset+8].decode('utf-8')
    large_size = struct.unpack('>Q', buffer[offset+8:offset+16])[0] if size == 1 else size
    return {'size': large_size, 'type': box_type}

def modify_moof_sequence(buffer, new_sequence):
    """
    修改M4S文件的MOOF序列号
    Args:
        buffer (bytes): 输入buffer
        new_sequence (int): 新的序列号
    Returns:
        bytes: 修改后的buffer
    """
    modified_buffer = bytearray(buffer)
    offset = 0
    modified = False

    # 遍历所有box
    while offset < len(buffer):
        header = parse_box_header(buffer, offset)
        
        if header['type'] == 'moof':
            # 在moof box中查找mfhd box
            current_offset = offset + 8
            while current_offset < offset + header['size']:
                sub_header = parse_box_header(buffer, current_offset)
                if sub_header['type'] == 'mfhd':
                    # 修改序列号
                    struct.pack_into('>I', modified_buffer, current_offset + 12, new_sequence)
                    modified = True
                    break
                current_offset += sub_header['size']
        
        offset += header['size']

    if not modified:
        raise Exception('No MOOF box found in the file')

    return bytes(modified_buffer)

def lambda_handler(event, context):
    try:
        # 解析请求参数
        body = json.loads(event['body'])
        ad_content = body.get('ad_content')
        target_segment = body.get('target_segment')

        if not ad_content or target_segment is None:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'message': 'Missing required parameters: ad_content or target_segment'
                })
            }

        # 下载M4S文件
        response = requests.get(ad_content)
        buffer = response.content

        # 修改segment number
        modified_buffer = modify_moof_sequence(buffer, target_segment)

        # 返回修改后的文件
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename="modified.m4s"'
            },
            'body': b64encode(modified_buffer).decode('utf-8'),
            'isBase64Encoded': True
        }

    except Exception as error:
        print(f'Error: {str(error)}')
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Internal server error',
                'error': str(error)
            })
        }
