import { store } from '../data/store.js'
import { emitToClients } from '../socket.js'

// GET /api/notifications
export async function listNotifications(req, res) {
  try {
    const notes = await store.listNotifications(req.user._id, req.user.role)
    return res.json({ notifications: notes })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load notifications', detail: err.message })
  }
}

// PATCH /api/notifications/:id/read
export async function markRead(req, res) {
  try {
    await store.markNotificationRead(req.params.id, req.user._id)
    return res.json({ message: 'Marked read' })
  } catch (err) {
    return res.status(500).json({ error: 'Failed', detail: err.message })
  }
}

// PATCH /api/notifications/read-all
export async function markAllRead(req, res) {
  try {
    await store.markAllRead(req.user._id, req.user.role)
    return res.json({ message: 'All marked read' })
  } catch (err) {
    return res.status(500).json({ error: 'Failed', detail: err.message })
  }
}

// POST /api/notifications/broadcast (admin) — push a message to all clients
export async function broadcast(req, res) {
  try {
    const { title, message } = req.body || {}
    if (!title || !message) return res.status(400).json({ error: 'title and message required' })
    const notif = await store.createNotification({
      recipientId: null, recipientRole: 'client', type: 'broadcast', title, message
    })
    emitToClients('notification', notif)
    return res.status(201).json({ notification: notif })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to broadcast', detail: err.message })
  }
}
