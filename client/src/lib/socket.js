import { io } from 'socket.io-client'

// In production, connect to the deployed backend; in dev, '' lets Vite proxy /socket.io → :5000.
const SOCKET_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

let socket = null
// Map<subscriberFn, cleanupFn|null> — remembers each subscriber's cleanup so we can
// run it when the socket is replaced or the subscriber unsubscribes.
const readyListeners = new Map()

function fire(fn, s) {
  try {
    const cleanup = fn(s)
    readyListeners.set(fn, typeof cleanup === 'function' ? cleanup : null)
  } catch { /* subscriber error */ }
}

function runCleanup(fn) {
  const cleanup = readyListeners.get(fn)
  if (typeof cleanup === 'function') { try { cleanup() } catch { /* cleanup error */ } }
  if (readyListeners.has(fn)) readyListeners.set(fn, null)
}

export function connectSocket() {
  const token = localStorage.getItem('calmer_token')
  if (!token) return null
  if (socket && socket.connected) return socket
  if (socket) {
    // Old socket is being replaced — run subscriber cleanups so listeners
    // don't accumulate on a dead socket instance.
    readyListeners.forEach((_, fn) => runCleanup(fn))
    socket.disconnect()
  }
  socket = io(SOCKET_URL || '/', { auth: { token }, transports: ['websocket', 'polling'] })
  // Tell every subscriber a (new) socket exists — fixes the mount-order race
  // where layouts render before /auth/me finishes and never attach listeners.
  readyListeners.forEach((_, fn) => fire(fn, socket))
  return socket
}

export function getSocket() { return socket }

// Subscribe to socket availability. If a socket already exists, fires immediately.
// The subscriber may return a cleanup function (like useEffect); it runs on
// unsubscribe and whenever the socket is replaced. Returns an unsubscribe fn.
//   useEffect(() => onSocket((s) => { s.on('x', h); return () => s.off('x', h) }), [])
export function onSocket(fn) {
  readyListeners.set(fn, null)
  if (socket) fire(fn, socket)
  return () => { runCleanup(fn); readyListeners.delete(fn) }
}

export function disconnectSocket() {
  if (socket) {
    readyListeners.forEach((_, fn) => runCleanup(fn))
    socket.disconnect()
    socket = null
  }
}
