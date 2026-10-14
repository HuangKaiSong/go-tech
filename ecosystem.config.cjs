const path = require('node:path');

const root = __dirname;
const feedbackAiRoot = path.join(root, 'apps/feedback-ai');
const webMonitorRoot = path.join(root, 'apps/web-monitor');

module.exports = {
  apps: [
    {
      name: 'go-tech-next',
      author: 'hks',
      cwd: root,
      script: path.join(root, 'apps/web-h5/scripts/start-standalone.cjs'),
      node_args: '--max-old-space-size=4096',
      out_file: path.join(root, 'logs/go-tech-next.log'),
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'http://10.128.20.88:7171'
      }
    },
    {
      name: 'web-monitor',
      cwd: webMonitorRoot,
      script: path.join(webMonitorRoot, 'dist/main.mjs'),
      interpreter: 'node',
      node_args: '--env-file=.env',
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      autorestart: true,
      restart_delay: 3000,
      kill_timeout: 15000,
      max_memory_restart: '1G',
      out_file: path.join(root, 'logs/web-monitor.log'),
      error_file: path.join(root, 'logs/web-monitor-error.log'),
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'feedback-ai',
      cwd: feedbackAiRoot,
      script: path.join(feedbackAiRoot, '.venv/bin/uvicorn'),
      interpreter: 'none',
      args: 'feedback_ai.main:app --host 0.0.0.0 --port 8100 --workers 2',
      autorestart: true,
      restart_delay: 3000,
      max_memory_restart: '1G',
      out_file: path.join(root, 'logs/feedback-ai.log'),
      error_file: path.join(root, 'logs/feedback-ai-error.log')
    },
    {
      name: 'feedback-ai-sync',
      cwd: feedbackAiRoot,
      script: path.join(feedbackAiRoot, '.venv/bin/feedback-ai'),
      interpreter: 'none',
      args: 'sync --watch --limit 10 --interval 5',
      autorestart: true,
      restart_delay: 5000,
      max_memory_restart: '512M',
      out_file: path.join(root, 'logs/feedback-ai-sync.log'),
      error_file: path.join(root, 'logs/feedback-ai-sync-error.log')
    }
  ]
};
