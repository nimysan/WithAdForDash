# WithAdForDash

本项目包含两个主要组件：

1. dash-exception-detect: 基于CloudFront Function的DASH流媒体广告插入服务
2. alb-python-stack: 基于ALB的Python服务

## dash-exception-detect

基于AWS Lambda@Edge的CloudFront请求处理项目，用于在DASH流媒体播放过程中插入广告内容。

### 技术栈

- AWS Lambda@Edge
- CloudFront
- Serverless Framework
- Node.js

### 功能特性

- 基于客户端IP过滤请求
- 识别DASH流媒体分片
- 支持动态广告内容注入
- 可配置的IP白名单和广告内容URL

### 目录结构

```
dash-exception-detect/
├── serverless.yml      # Serverless Framework配置
├── src/
│   ├── cloudfront-function.js  # CloudFront函数处理程序
│   ├── compare-mpd.js          # MPD文件比较
│   ├── handler.js              # Lambda处理程序
│   ├── modify-m4s.js          # M4S文件修改
│   └── parse-m4s.js           # M4S文件解析
└── test/
    ├── handler.test.js        # 测试文件
    └── events/               # 测试事件数据
        └── viewer-request.json
```

## alb-python-stack

基于Application Load Balancer的Python服务。

### 目录结构

```
alb-python-stack/
├── README.md           # 项目文档
├── requirements.txt    # Python依赖
├── serverless.yml     # Serverless配置
└── src/
    └── handler.py     # Python处理程序
```

## 开发环境设置

1. 全局安装 Serverless Framework：
```bash
npm install -g serverless
```

2. 安装项目依赖：
```bash
npm install
```

3. 配置AWS凭证：
```bash
aws configure
```

## 注意事项

1. Lambda@Edge限制：
   - 内存限制：128MB
   - 超时限制：5秒
   - 不支持环境变量
   - 必须部署在us-east-1区域

2. 部署注意事项：
   - 确保提供了正确的CloudFront Distribution ID
   - 确保提供了有效的广告内容URL
   - 确保IP列表格式正确（逗号分隔）

## 演示视频

以下视频展示了广告插入的效果：

<video width="100%" controls>
  <source src="dash-迁入广告.mp4" type="video/mp4">
  您的浏览器不支持 video 标签。
</video>

## M4S文件格式

M4S (MPEG-4 Segment) 是DASH流媒体使用的文件格式。详细信息可参考：
https://docs.fileformat.com/zh/video/m4s/

[了解m4s格式](https://blog.csdn.net/W1107101310/article/details/139359904)

https://blog.csdn.net/W1107101310/article/details/139359904