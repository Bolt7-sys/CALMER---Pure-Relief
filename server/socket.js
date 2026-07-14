// Socket.io real-time layer for CALMER: notifications, live tracking, chat, calls.
import { Server } from 'socket.io'
import { verifyToken } from './utils/auth.js'
import { store } from './data/store.js'

let io = null

// Rooms:
//   user:<userId>   — a specific user's personal room (notifications)
//   admins          — all admin sockets (new orders, chat pings)
//   clients         — all client sockets (broadcasts)
//   order:<orderId> — participants of an order (chat + live location)

const validCoord = (lat, lng) =>
  Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) &&
  Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN || '*', methods: ['GET', 'POST'] }
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

    // SECURITY: verify order ownership before joining its room. Without this,
    // any authenticated client could snoop other customers' chats & live locations.
    socket.on('order:join', async (orderId) => {
      if (!orderId) return
      try {
        const order = await store.findOrderById(String(orderId))
        if (!order) return
        if (role !== 'admin' && String(order.clientId) !== String(userId)) return
        socket.join(`order:${orderId}`)
      } catch { /* invalid id — ignore */ }
    })
    socket.on('order:leave', (orderId) => {
      if (orderId) socket.leave(`order:${orderId}`)
    })

    // Relays below only fire if the sender actually joined the room —
    // a raw emit can't bypass the ownership check in order:join.
    const inOrderRoom = (orderId) => socket.rooms.has(`order:${orderId}`)

    socket.on('chat:typing', ({ orderId, typing }) => {
      if (orderId && inOrderRoom(orderId)) {
        socket.to(`order:${orderId}`).emit('chat:typing', { orderId, role, typing: !!typing })
      }
    })

    // WebRTC-style call signaling relay (built-in calls)
    socket.on('call:signal', ({ orderId, signal, kind }) => {
      if (orderId && inOrderRoom(orderId)) {
        socket.to(`order:${orderId}`).emit('call:signal', { orderId, signal, kind, from: role })
      }
    })
    socket.on('call:invite', ({ orderId, kind }) => {
      if (orderId && inOrderRoom(orderId)) {
        socket.to(`order:${orderId}`).emit('call:invite', { orderId, kind: kind === 'video' ? 'video' : 'voice', from: role })
      }
    })
    socket.on('call:end', ({ orderId }) => {
      if (orderId && inOrderRoom(orderId)) {
        socket.to(`order:${orderId}`).emit('call:end', { orderId, from: role })
      }
    })

    // Live rider location stream — admin only, coordinates validated
    socket.on('location:update', ({ orderId, latitude, longitude }) => {
      if (role !== 'admin') return
      if (orderId != null && validCoord(latitude, longitude) && inOrderRoom(orderId)) {
        io.to(`order:${orderId}`).emit('order:location', {
          orderId, riderLocation: { latitude: Number(latitude), longitude: Number(longitude), timestamp: new Date() }
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
