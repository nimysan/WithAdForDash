# M4S Processing Server

A multi-process server for handling M4S file processing.

## Features

- Multi-process support using Node.js cluster module
- Process management with PM2
- Auto-restart on file changes
- Zero-downtime reloads
- Memory monitoring and auto-restart
- CPU/Memory usage monitoring
- M4S file analysis with detailed box information

## M4S Analysis

The server includes a command-line tool for analyzing M4S files:

```bash
npm run parsem4s
```

This command scans all M4S files in the assets directory and displays a detailed table with the following information:
- Filename
- STYP (Segment Type Box) information
- SIDX (Segment Index Box) details
- MOOF (Movie Fragment Box) sequence and size
- MDAT (Media Data Box) size

The analysis provides insights into the structure and metadata of M4S files, useful for debugging and verification.

as below

```bash
M4S File Analysis Table
========================================================================================================================
Filename                       | STYP Brand | STYP Ver | SIDX Ver | SIDX ID  | Timescale  | Earliest PTS    | MOOF Sz  | MOOF Seq   | MDAT Sz 
------------------------------------------------------------------------------------------------------------------------
0-38304768.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 0               | 1300     | 1          | 96123   
0-38304769.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 38400           | 1300     | 2          | 58425   
0-38304770.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 76800           | 1300     | 3          | 63575   
0-38304771.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 115200          | 1300     | 4          | 61744   
0-38304772.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 153600          | 1300     | 5          | 65417   
0-38304773.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 192000          | 916      | 6          | 46251   
1-38304768.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 0               | 1300     | 1          | 76831   
1-38304769.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 38400           | 1300     | 2          | 51476   
1-38304770.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 76800           | 1300     | 3          | 60990   
1-38304771.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 115200          | 1300     | 4          | 54644   
1-38304772.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 153600          | 1300     | 5          | 64461   
1-38304773.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 192000          | 916      | 6          | 42217   
2-38304768.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 0               | 1300     | 1          | 65911   
2-38304769.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 38400           | 1300     | 2          | 36497   
2-38304770.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 76800           | 1300     | 3          | 45041   
2-38304771.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 115200          | 1300     | 4          | 38144   
2-38304772.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 153600          | 1300     | 5          | 45064   
2-38304773.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 192000          | 916      | 6          | 31567   
3-38304768.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 0               | 1300     | 1          | 97057   
3-38304769.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 38400           | 1300     | 2          | 85472   
3-38304770.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 76800           | 1300     | 3          | 94261   
3-38304771.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 115200          | 1300     | 4          | 79259   
3-38304772.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 153600          | 1300     | 5          | 95147   
3-38304773.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 192000          | 916      | 6          | 62565   
4-38304768.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 0               | 1300     | 1          | 49454   
4-38304769.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 38400           | 1300     | 2          | 35655   
4-38304770.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 76800           | 1300     | 3          | 41253   
4-38304771.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 115200          | 1300     | 4          | 34705   
4-38304772.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 153600          | 1300     | 5          | 43387   
4-38304773.m4s                 | msdh       | 0        | 1        | 1        | 12800      | 192000          | 916      | 6          | 25728 

```

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
├── src/              # Source code
│   ├── server.js     # Main server file
│   └── parse-m4s-files.js  # M4S analysis script
├── lib/           # Utility functions
│   ├── parse-m4s.js
│   └── modify-m4s.js
├── assets/        # Static assets
│   └── AD001/     # M4S files
├── test/          # Test files
└── ecosystem.config.js  # PM2 configuration
