import { io } from 'socket.io-client'

// In production, connect to the deployed backend; in dev, '' lets Vite proxy /socket.io → :5000.
const SOCKET_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

let socket = null

export function connectSocket() {
  const token = localStorage.getItem('calmer_token')
  if (!token) return null
  if (socket && socket.connected) return socket
  socket = io(SOCKET_URL || '/', { auth: { token }, transports: ['websocket', 'polling'] })
  return socket
}

export function getSocket() { return socket }

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null }
}
