// PM2 ecosystem configuration for Blood Node
module.exports = {
  apps: [
    {
      name: 'blood-node',
      script: 'npm',
      args: 'start',
      cwd: './blood_node',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Auto-restart configuration
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Logging
      log_file: './logs/blood-node.log',
      out_file: './logs/blood-node-out.log',
      error_file: './logs/blood-node-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Health monitoring
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      
      // Advanced features
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },
    {
      name: 'blood-node-cleanup',
      script: 'npm',
      args: 'run cleanup-tokens',
      cwd: './blood_node',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0 * * * *', // Run every hour
      env: {
        NODE_ENV: 'production'
      },
      // Logging
      log_file: './logs/cleanup.log',
      out_file: './logs/cleanup-out.log',
      error_file: './logs/cleanup-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Don't restart on exit (cron job)
      autorestart: false,
      max_restarts: 0
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/blood-node.git',
      path: '/var/www/blood-node',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
