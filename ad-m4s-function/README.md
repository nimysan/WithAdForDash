# M4S 处理服务

## 基本介绍

M4S（MPEG-DASH 媒体片段）文件是流媒体传输中的媒体片段文件，用于实现自适应比特率流媒体。本服务主要用于处理视频广告场景下的 M4S 文件，实现序列号动态替换，使广告片段能够无缝插入到主视频流中。

### 主要应用场景

- 视频广告投放：动态修改广告片段序列号，实现与主视频的无缝衔接
- 流媒体分析：解析和分析 M4S 文件结构，帮助调试和优化
- 内容适配：支持不同轨道（音频、视频、字幕等）的处理

### 核心功能

- 解析 M4S 文件结构和内容（box结构、序列号等）
- 动态修改 M4S 文件序列号，确保片段连续性
- 提供 M4S 文件分析接口，便于问题诊断
- 支持多轨道（video/audio）文件处理
- 集群部署支持，自动负载均衡

## 目录结构

```
ad-m4s-function/
├── assets/              # M4S 文件存储目录
│   └── AD001/          # 广告素材目录
├── lib/                 # 核心库文件
│   ├── parse-m4s.js    # M4S 解析功能
│   └── modify-m4s.js   # M4S 修改功能
├── src/                 # 源代码
│   ├── server.js       # 服务器入口
│   └── parse-m4s-files.js  # 文件解析工具
└── test/               # 测试文件
```

## 安装说明

1. 安装依赖
```bash
npm install
```

2. 安装 PM2 (如果未安装)
```bash
npm install -g pm2
```

3. 创建必要的目录结构
```bash
mkdir -p assets/AD001
```

## M4S 文件说明

### 文件结构
M4S 文件主要包含以下 box：
- ftyp: 文件类型信息
- styp: 片段类型信息
- sidx: 片段索引信息
- moof: 片段元数据（包含序列号）
- mdat: 实际媒体数据

### 文件存放规则

1. 文件组织结构：`assets/{SN}/{trackId}-{sequence}.m4s`
   - SN: 广告标识目录（如 AD001）
   - trackId: 轨道ID（0-4）
     * 0: 视频轨道
     * 1: 主音频轨道
     * 2-4: 备用音频轨道
   - sequence: 序列号（用于片段排序和连接）

2. 请求路径格式：`/{SN}/{trackId}-{sequence}.m4s`
   - 请求 `/AD001/0-38312610.m4s` 会匹配 `assets/AD001/0-38312610.m4s` 文件

例如：
```
assets/
└── AD001/                    # 广告标识目录
    ├── 0-38312610.m4s       # 视频轨道
    ├── 1-38312610.m4s       # 主音频轨道
    └── 2-38312610.m4s       # 备用音频轨道
```

### 序列号说明
- 序列号用于确定片段的播放顺序
- 每个片段的序列号必须连续
- 不同轨道的相同时间点应使用相同的序列号

## 服务管理

### 启动服务

```bash
npm start
```
服务将在 3000 端口启动，并自动使用 PM2 进行进程管理。

### 停止服务

```bash
npm run stop
```

### 重启服务

```bash
npm run restart
```

### 重新加载服务

```bash
npm run reload
```

### 删除服务

```bash
npm run delete
```

## 日志查看

### 查看实时日志

```bash
npm run logs
```

### 查看服务状态

```bash
npm run status
```

### 监控服务

```bash
npm run monit
```

## API 接口

### 1. M4S 文件解析

```
GET /tool/parsem4s.json?url={m4s-file-url}
```

返回 M4S 文件的详细解析信息。

### 2. M4S 文件请求

```
GET /{SN}/{trackId}-{sequence}.m4s
```

- SN: 广告标识（如 AD001）
- trackId: 轨道ID（0-4）
- sequence: 序列号（数字）

例如：`/AD001/0-38312610.m4s`

## 使用示例

1. 启动服务：
```bash
npm start
```

2. 查看服务状态：
```bash
npm run status
```

3. 解析 M4S 文件：
```bash
curl "http://localhost:3000/tool/parsem4s.json?url=http://example.com/video.m4s"
```

4. 查看日志：
```bash
npm run logs
```

## 注意事项

1. 确保 assets/AD001 目录中包含所需的 M4S 文件
2. 服务使用 PM2 进行进程管理，确保系统已安装 PM2
3. 默认监听 3000 端口，如需修改可在 src/server.js 中更改
4. 服务会自动根据 CPU 核心数启动多个工作进程
5. 建议定期查看日志确保服务运行正常
