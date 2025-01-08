module.exports = {
  apps: [{
    name: 'm4s-server',
    script: 'src/server.js',
    instances: 'max',     // Use maximum number of CPU cores
    exec_mode: 'cluster', // Run in cluster mode
    watch: true,         // Auto restart on file changes
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
