module.exports = {
  apps: [{
    name: 'woying-backend',
    cwd: '/home/ubuntu/woying-ai/backend',
    script: 'src/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DB_HOST: 'localhost',
      DB_USER: 'woying',
      DB_PASSWORD: "woying2026secure",
      DB_NAME: 'woying_ai'
    },
    max_memory_restart: '500M',
    error_file: '/home/ubuntu/woying-ai/logs/backend-error.log',
    out_file: '/home/ubuntu/woying-ai/logs/backend-out.log',
    merge_logs: true
  }]
}
