// Auth middleware: verifies JWT and loads the user.
import { verifyToken } from '../utils/auth.js'
import { store } from '../data/store.js'

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Authentication required' })

  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'Invalid or expired session' })

  const user = await store.findUserById(payload.id)
  if (!user || !user.isActive) return res.status(401).json({ error: 'Account not found or disabled' })

  req.user = { _id: String(user._id), username: user.username, role: user.role, fullName: user.fullName }
  next()
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}
