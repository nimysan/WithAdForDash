# ALB Python Stack with FFmpeg

## 创建 FFmpeg Layer

1. 在本地创建Layer:

```bash
# 创建临时目录
mkdir -p ffmpeg-layer/bin

# 下载 ffmpeg 静态构建版本
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz

# 解压
tar xf ffmpeg-release-amd64-static.tar.xz

# 复制ffmpeg二进制文件到layer目录
cp ffmpeg-*-amd64-static/ffmpeg ffmpeg-layer/bin/
cp ffmpeg-*-amd64-static/ffprobe ffmpeg-layer/bin/

# 创建zip文件
cd ffmpeg-layer
zip -r ../ffmpeg-layer.zip .
cd ..
```

2. 创建Layer:

```bash
# 创建Layer
aws lambda publish-layer-version \
    --layer-name ffmpeg \
    --description "FFmpeg layer for video processing" \
    --license-info "GPL" \
    --zip-file fileb://ffmpeg-layer.zip \
    --compatible-runtimes python3.12

# 记下输出中的LayerVersionArn
```

3. 更新serverless.yml中的Layer ARN:

```yaml
functions:
  albHandler:
    handler: src/handler.handler
    layers:
      - <YOUR_LAYER_ARN>  # 替换为上一步得到的ARN
```

## 使用说明

1. 部署前先创建ffmpeg layer
2. 更新serverless.yml中的layer ARN
3. 部署serverless应用

## API使用

POST请求格式:
- Body: Base64编码的视频数据
- Query参数:
  - text: 水印文字 (可选，默认为时间戳)

响应:
- 成功: 返回处理后的视频 (Base64编码)
- 失败: 返回错误信息


## 执行测试

```bash

ffmpeg -i https://dash.plaza.red/AD001/ad.mp4 -vf drawtext=text='test':fontsize=24:fontcolor=white:x=10:y=10 -codec:a copy -y hello3.mp4


```
ffmpeg -allowed_extensions ALL -i "0-1.m4s" -c copy input.mp4

ffmpeg -i 0-1.m4s -vf "drawtext=text='test':fontsize=24:fontcolor=white:x=10:y=10" -c:v libx264 -c:a copy -f ssegment -reset_timestamps 1 output_%03d.m4s


参考文档
[利用ffmpeg将.m4s的视频格式转换成.mp4](https://blog.csdn.net/qq_42039214/article/details/117123056)

ffmpeg  -i https://dash.plaza.red/TVD0002/chunk-stream0-62948.m4s -i https://dash.plaza.red/TVD0002/chunk-stream2-80359.m4s -c:v copy -strict experimental 19.mp4

ffmpeg -i input.m4s -i xx.m4s -c copy output.mp4 


./ffmpeg -i https://dash.plaza.red/AD001/ad.mp4 -vf "drawtext=text='test':fontsize=24:fontcolor=white:x=10:y=10" -codec:a copy  -y /tmp/tmp1x7gr_f2.mp4