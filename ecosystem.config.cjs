module.exports = {
  apps: [
    {
      name: 'calmer-server',
      cwd: './server',
      script: 'server.js',
      env: { NODE_ENV: 'development', PORT: 5000 },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'calmer-client',
      cwd: './client',
      script: 'node_modules/vite/bin/vite.js',
      args: '--host 0.0.0.0 --port 3000',
      env: { NODE_ENV: 'development' },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
