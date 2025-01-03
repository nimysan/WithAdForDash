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

4. 准备 CloudFront 配置：
   - 确保已创建 CloudFront Distribution
   - 获取 Distribution ID（在 CloudFront 控制台可以找到）
   - 确保 Distribution 处于 Deployed 状态

## 配置参数

项目使用以下配置参数：

- BAD_CLIENT_IP_SET: 需要处理的IP地址列表，以逗号分隔（默认值：'127.0.0.1'）
- AD_CONTENT_URL: 广告内容的URL地址（默认值：'https://example.com/ad.mp4'）
- DEPLOYMENT_BUCKET: 部署用的S3桶名称（默认值：'your-deployment-bucket'）
- DISTRIBUTION_ID: 已存在的 CloudFront Distribution ID（必填，无默认值）

## 部署

### 版本管理

由于 Lambda@Edge 函数的特殊性，删除已关联到 CloudFront Distribution 的函数可能会遇到困难。为了避免删除问题：

1. 每次重大更新时使用新的函数名（在 serverless.yml 中修改函数名，如 viewerRequestV2）
2. 新函数部署成功后，在 CloudFront 控制台手动删除旧函数关联
3. 等待 CloudFront 完成部署（状态变为 Deployed）后，才能删除旧函数
4. 如果遇到删除错误，请等待几小时后重试，确保 CloudFront 在所有边缘位置都完成了更新

### 部署命令

本项目只能部署到已存在的 CloudFront Distribution 上。使用以下命令部署：

```bash
# 使用新的函数名部署（当前为 viewerRequestV2）
serverless deploy \
  --param="BAD_CLIENT_IP_SET=1.1.1.1,2.2.2.2" \
  --param="AD_CONTENT_URL=https://example.com/ad.mp4" \
  --param="DEPLOYMENT_BUCKET=your-deployment-bucket" \
  --param="DISTRIBUTION_ID=EXXXXXXXXXXXXX"
```

如果提供的 Distribution ID 不存在，部署将失败并显示错误信息。请确保：
1. Distribution ID 正确且存在
2. 该 Distribution 处于 Deployed 状态
3. 你有权限修改该 Distribution

## 测试

项目提供两种测试方式：

### 1. 单元测试

使用 Jest 进行单元测试：

```bash
npm test
```

测试文件位于 `test/handler.test.js`，使用 `test/events/viewer-request.json` 中的事件数据进行测试。

### 2. 本地函数调用

使用 Serverless Framework 在本地模拟 Lambda 函数调用：

```bash
npm run local
```

这将使用 `test/events/viewer-request.json` 中的事件数据来模拟 CloudFront viewer-request 事件。

你可以根据需要修改 `test/events/viewer-request.json` 中的测试数据来测试不同场景。

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
    ├── handler.test.js # Jest 测试文件
    └── events/         # 测试事件数据
        └── viewer-request.json


## Quota

1. The function timeout is larger than the maximum allowed for functions that are triggered by a CloudFront event. Current timeout value: 10 seconds. Max allowed timeout value: 5 seconds.
2. is associating to E1UZTGEU927TUF CloudFront Distribution. waiting for deployed status. ServerlessError: The function cannot have environment variables.