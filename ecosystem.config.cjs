module.exports = {
  apps: [
    {
      name: 'go-tech-next',
      host: '0.0.0.0',
      port: '3200',
      exec_mode: 'cluster',
      instance: '1',
      author: 'hks',
      out_file: '/dev/null',
      script: 'pnpm run start:h5 -p 3200',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}