# WithAdForDash

基于AWS Lambda@Edge的CloudFront请求处理项目，用于在DASH流媒体播放过程中插入广告内容。

## 项目说明

本项目使用Lambda@Edge在CloudFront的ViewerRequest阶段处理请求，根据特定条件（IP地址和chunk序号）决定是否返回广告内容。

## 技术栈

- AWS Lambda@Edge
- CloudFront
- Serverless Framework
- Node.js

## 功能特性

- 基于客户端IP过滤请求
- 识别DASH流媒体分片
- 支持动态广告内容注入
- 可配置的IP白名单和广告内容URL

## 开发环境设置

1. 安装依赖：
```bash
npm install
```

2. 配置AWS凭证：
```bash
aws configure
```

3. 更新serverless.yml中的配置：
   - CloudFront Distribution ID
   - 部署桶名称（deploymentBucket）

## 配置参数

项目使用以下配置参数：

- BAD_CLIENT_IP_SET: 需要处理的IP地址列表，以逗号分隔
- AD_CONTENT_URL: 广告内容的URL地址
- DEPLOYMENT_BUCKET: 部署用的S3桶名称

## 部署

使用以下命令部署，需要提供必要的参数：

```bash
serverless deploy \
  --param="BAD_CLIENT_IP_SET=1.1.1.1,2.2.2.2" \
  --param="AD_CONTENT_URL=https://example.com/ad.mp4" \
  --param="DEPLOYMENT_BUCKET=your-deployment-bucket"
```

## 本地测试

可以使用以下命令进行本地测试：

```bash
npm run local
```

测试事件数据位于 `test/events/viewer-request.json`，可以根据需要修改测试数据。

## 工作原理

1. 当请求到达CloudFront时，Lambda@Edge函数会被触发
2. 函数检查请求的客户端IP是否在配置的IP列表中
3. 如果IP匹配，则检查请求的URL是否符合DASH分片格式
4. 对于每20个分片，返回一个广告内容
5. 其他情况返回原始请求

## 注意事项

1. Lambda@Edge限制：
   - 内存限制：128MB
   - 超时限制：5秒
   - 不支持环境变量（配置值会在构建时注入）
   - 必须部署在us-east-1区域

2. 部署注意事项：
   - 确保提供了正确的CloudFront Distribution ID
   - 确保提供了有效的广告内容URL
   - 确保IP列表格式正确（逗号分隔）

3. 性能考虑：
   - 广告内容应该预先缓存
   - 确保广告内容URL的响应时间在Lambda超时限制内

## 目录结构

```
.
├── README.md           # 项目文档
├── package.json        # 项目配置和依赖
├── serverless.yml      # Serverless Framework配置
├── src/
│   └── handler.js      # Lambda函数处理程序
└── test/
    └── events/         # 测试事件数据
        └── viewer-request.json
