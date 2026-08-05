module.exports = {
  apps: [
    {
      name: 'go-tech-next',
      author: 'hks',
      out_file: './logs/go-tech-next.log',
      cwd: './',
      script: 'pnpm',
      args: ['run', 'start:h5'],
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'http://10.128.20.88:7171'
      }
    }
  ]
};
