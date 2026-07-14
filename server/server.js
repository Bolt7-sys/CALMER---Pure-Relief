import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import http from 'http'
import { connectDB } from './config/db.js'
import { initSocket } from './socket.js'
import { store } from './data/store.js'
import { seedIfEmpty } from './seed.js'
import { rateLimit } from './middleware/rateLimit.js'

import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import notificationRoutes from './routes/notifications.js'
import chatRoutes from './routes/chat.js'
import analyticsRoutes from './routes/analytics.js'

const app = express()
app.disable('x-powered-by')
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }))
app.use(express.json({ limit: '1mb' }))

// Security headers (lightweight helmet)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  next()
})

// Global soft rate limit for the whole API (per IP)
app.use('/api', rateLimit({ windowMs: 60_000, max: 300 }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    store: store.usingMongo() ? 'mongodb' : 'in-memory',
    uptime: Math.round(process.uptime()),
    time: new Date().toISOString()
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/analytics', analyticsRoutes)

app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint not found' }))

// Central error handler (malformed JSON bodies etc. -> clean 400, not a crash/stack leak)
app.use((err, req, res, next) => {
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON body' })
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request body too large' })
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 5000
const server = http.createServer(app)
initSocket(server)

// Never let a stray rejection kill the delivery platform
process.on('unhandledRejection', (err) => console.error('UnhandledRejection:', err))
process.on('uncaughtException', (err) => console.error('UncaughtException:', err))

async function start() {
  await connectDB()
  await seedIfEmpty()
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🌿 CALMER API running on port ${PORT}`)
    console.log(`   Data store: ${store.usingMongo() ? 'MongoDB' : 'in-memory (dev)'}`)
    console.log(`   Health: http://localhost:${PORT}/api/health\n`)
  })
}
start()
