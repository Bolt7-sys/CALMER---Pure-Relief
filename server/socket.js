// Socket.io real-time layer for CALMER: notifications, live tracking, chat, calls.
import { Server } from 'socket.io'
import { verifyToken } from './utils/auth.js'

let io = null

// Rooms:
//   user:<userId>   — a specific user's personal room (notifications)
//   admins          — all admin sockets (new orders, chat pings)
//   clients         — all client sockets (broadcasts)
//   order:<orderId> — participants of an order (chat + live location)

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  })

  // Authenticate socket via JWT (handshake auth or query)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token
    const payload = token ? verifyToken(token) : null
    if (!payload) return next(new Error('Unauthorized socket'))
    socket.user = payload
    next()
  })

  io.on('connection', (socket) => {
    const { id: userId, role } = socket.user
    socket.join(`user:${userId}`)
    socket.join(role === 'admin' ? 'admins' : 'clients')

    // Join a specific order room (for chat + tracking)
    socket.on('order:join', (orderId) => {
      if (orderId) socket.join(`order:${orderId}`)
    })
    socket.on('order:leave', (orderId) => {
      if (orderId) socket.leave(`order:${orderId}`)
    })

    // Typing indicator relay
    socket.on('chat:typing', ({ orderId, typing }) => {
      if (orderId) socket.to(`order:${orderId}`).emit('chat:typing', { orderId, role, typing })
    })

    // WebRTC-style call signaling relay (built-in calls)
    socket.on('call:signal', ({ orderId, signal, kind }) => {
      if (orderId) socket.to(`order:${orderId}`).emit('call:signal', { orderId, signal, kind, from: role })
    })
    socket.on('call:invite', ({ orderId, kind }) => {
      if (orderId) socket.to(`order:${orderId}`).emit('call:invite', { orderId, kind, from: role })
    })
    socket.on('call:end', ({ orderId }) => {
      if (orderId) socket.to(`order:${orderId}`).emit('call:end', { orderId, from: role })
    })

    // Live rider location relay (admin streams location -> order room)
    socket.on('location:update', ({ orderId, latitude, longitude }) => {
      if (orderId != null && latitude != null && longitude != null) {
        io.to(`order:${orderId}`).emit('order:location', {
          orderId, riderLocation: { latitude, longitude, timestamp: new Date() }
        })
      }
    })

    socket.on('disconnect', () => { /* rooms auto-cleaned */ })
  })

  return io
}

// ---- Emit helpers (used by controllers) ----
export function emitToUser(userId, event, payload) {
  if (io && userId) io.to(`user:${userId}`).emit(event, payload)
}
export function emitToAdmins(event, payload) {
  if (io) io.to('admins').emit(event, payload)
}
export function emitToClients(event, payload) {
  if (io) io.to('clients').emit(event, payload)
}
export function emitToOrder(orderId, event, payload) {
  if (io && orderId) io.to(`order:${orderId}`).emit(event, payload)
}
export function getIO() { return io }
