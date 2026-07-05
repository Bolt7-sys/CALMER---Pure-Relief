import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import http from 'http'
import { connectDB } from './config/db.js'
import { initSocket } from './socket.js'
import { store } from './data/store.js'
import { seedIfEmpty } from './seed.js'

import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import notificationRoutes from './routes/notifications.js'
import chatRoutes from './routes/chat.js'
import analyticsRoutes from './routes/analytics.js'

const app = express()
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }))
app.use(express.json({ limit: '2mb' }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', store: store.usingMongo() ? 'mongodb' : 'in-memory', time: new Date().toISOString() })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/analytics', analyticsRoutes)

app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint not found' }))

const PORT = process.env.PORT || 5000
const server = http.createServer(app)
initSocket(server)

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
