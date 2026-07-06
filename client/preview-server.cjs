// Production-preview server: serves the built dist/ exactly like Netlify would,
// and proxies /api + /socket.io to the backend so the full app is testable.
// This mirrors production (no Vite dev client, no HMR) => zero dev-only console noise.
const express = require('express')
const path = require('path')
const http = require('http')
const httpProxy = require('http-proxy')

const app = express()
const proxy = httpProxy.createProxyServer({ target: 'http://localhost:5000', ws: true, changeOrigin: true })
proxy.on('error', (err, req, res) => {
  if (res && !res.headersSent && res.writeHead) { res.writeHead(502); res.end('Backend unavailable') }
})

// Proxy API + websockets to the backend (preserve the full /api path)
app.use((req, res, next) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/socket.io')) {
    return proxy.web(req, res)
  }
  next()
})

// Serve the static production build
const dist = path.join(__dirname, 'dist')
app.use(express.static(dist))

// SPA fallback — every other route returns index.html (Express 5 named wildcard)
app.get('/*splat', (req, res) => res.sendFile(path.join(dist, 'index.html')))

const PORT = process.env.PREVIEW_PORT || 3000
const server = http.createServer(app)
// Forward websocket upgrades (Socket.io) to the backend
server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/socket.io')) proxy.ws(req, socket, head)
})
server.listen(PORT, '0.0.0.0', () => console.log(`CALMER production preview on :${PORT}`))
