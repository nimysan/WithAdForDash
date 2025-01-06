import json
import os
import subprocess
import tempfile
from datetime import datetime
from urllib.parse import unquote

def add_text_watermark(input_url, output_path, text):
    """
    Add text watermark to video using ffmpeg
    """
    # 确保ffmpeg路径正确 (Lambda Layer中的位置)
    ffmpeg_path = '/opt/bin/ffmpeg'
    if not os.path.exists(ffmpeg_path):
        raise FileNotFoundError(f"FFmpeg not found at {ffmpeg_path}")
    
    try:
        # FFmpeg command to add text watermark
        command = [
            ffmpeg_path, 
            '-i', input_url,  # 直接使用URL作为输入
            '-vf', f"drawtext=text='{text}':fontsize=24:fontcolor=white:x=10:y=10",
            '-codec:a', 'copy',
            '-movflags', 'frag_keyframe+empty_moov+faststart',  # 优化流式输出
            '-y',  # 覆盖输出文件
            output_path
        ]
        
        # Execute ffmpeg command
        print(f"Executing command: {' '.join(command)}")
        result = subprocess.run(
            command,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print(f"FFmpeg stdout: {result.stdout.decode()}")
        print(f"FFmpeg stderr: {result.stderr.decode()}")

    except subprocess.CalledProcessError as e:
        print(f"FFmpeg error: {e.stderr.decode()}")
        raise RuntimeError(f"FFmpeg processing failed: {e.stderr.decode()}")

def handler(event, context):
    """
    Lambda function handler for video processing
    """
    output_path = None

    try:
        print(f"Received event: {json.dumps(event, indent=2)}")
        
        # 检查ffmpeg是否可用
        if not os.path.exists('/opt/bin/ffmpeg'):
            raise RuntimeError("FFmpeg not found in Lambda environment")
        
        # 获取视频URL
        query_params = event.get('queryStringParameters', {}) or {}
        if 'url' not in query_params:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'No video URL provided'})
            }
            
        video_url = unquote(query_params['url'])  # URL解码
        print(f"Processing video from URL: {video_url}")
        
        # 创建临时输出文件
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as output_file:
            output_path = output_file.name

            # 获取水印文本
            watermark_text = query_params.get('text', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

            # 处理视频
            print("Processing video with ffmpeg...")
            add_text_watermark(video_url, output_path, watermark_text)

            # 检查输出文件
            if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
                raise RuntimeError("Failed to generate output video")

            # 获取输出文件大小
            file_size = os.path.getsize(output_path)

            # 读取处理后的视频
            with open(output_path, 'rb') as f:
                processed_video = f.read()

            # 返回处理后的视频
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': 'attachment; filename="processed_video.mp4"',
                    'Content-Length': str(file_size),
                    'Access-Control-Allow-Origin': '*',  # 允许跨域访问
                    'Access-Control-Allow-Methods': 'GET, OPTIONS'
                },
                'body': processed_video,
                'isBase64Encoded': False  # 直接返回二进制数据
            }

    except Exception as e:
        print(f"Error processing video: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'type': type(e).__name__
            })
        }
    finally:
        # 清理临时文件
        if output_path and os.path.exists(output_path):
            try:
                os.unlink(output_path)
            except Exception as e:
                print(f"Failed to delete temporary file {output_path}: {str(e)}")
