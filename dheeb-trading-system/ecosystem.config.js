/**
 * Ecosystem Config - PM2
 */

module.exports = {
  apps: [{
    name: 'dheeb-trading',
    script: './src/webhook-server.js',
    cwd: '/home/ubuntu/.openclaw/workspace/dheeb-trading-system',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 8080,
      WHATSAPP_TARGET: '+966565111696'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
