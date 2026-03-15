module.exports = {
  apps: [{
    name: 'dheeb-heartbeat',
    script: 'heartbeat-ndx.py',
    interpreter: 'python3',
    cwd: '/home/ubuntu/.openclaw/workspace/dheeb-mvp',
    instances: 1,
    exec_mode: 'fork',
    cron_restart: '*/5 * * * *', // كل 5 دقائق
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/home/ubuntu/.openclaw/workspace/logs/heartbeat-error.log',
    out_file: '/home/ubuntu/.openclaw/workspace/logs/heartbeat-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
