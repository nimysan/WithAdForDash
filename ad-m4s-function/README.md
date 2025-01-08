# M4S Processing Server

A multi-process server for handling M4S file processing.

## Features

- Multi-process support using Node.js cluster module
- Process management with PM2
- Auto-restart on file changes
- Zero-downtime reloads
- Memory monitoring and auto-restart
- CPU/Memory usage monitoring

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install PM2 globally (if not already installed):
```bash
npm install -g pm2
```

## Process Management Commands

### Starting the Server

Start the server in cluster mode using all available CPU cores:
```bash
npm start
```

### Stopping the Server

Stop all server processes:
```bash
npm run stop
```

### Restarting the Server

Full restart (stops and starts all processes):
```bash
npm run restart
```

### Zero-Downtime Reload

Reload all processes with zero downtime:
```bash
npm run reload
```

### Removing from PM2

Delete the server from PM2's process list:
```bash
npm run delete
```

## Monitoring

### Status Check

View the status of all processes:
```bash
npm run status
```

### Log Viewing

View real-time logs from all processes:
```bash
npm run logs
```

### Resource Monitoring

Monitor CPU and Memory usage in real-time:
```bash
npm run monit
```

## Configuration

The server configuration is managed through `ecosystem.config.js`:

- Runs in cluster mode using all available CPU cores
- Automatically restarts if any worker process crashes
- Watches for file changes and auto-restarts
- Restarts if memory usage exceeds 1GB
- Runs on port 3000 by default

## Directory Structure

```
ad-m4s-function/
├── src/           # Source code
│   └── server.js  # Main server file
├── lib/           # Utility functions
│   ├── parse-m4s.js
│   └── modify-m4s.js
├── assets/        # Static assets
│   └── AD001/     # M4S files
├── test/          # Test files
└── ecosystem.config.js  # PM2 configuration
