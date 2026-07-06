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
      // Production-style preview: serves the built dist/ (run `npm run build` first)
      // and proxies /api + /socket.io to the backend. Mirrors Netlify — no dev HMR noise.
      name: 'calmer-client',
      cwd: './client',
      script: 'preview-server.cjs',
      env: { NODE_ENV: 'production', PREVIEW_PORT: 3000 },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
