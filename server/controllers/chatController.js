import { store } from '../data/store.js'
import { emitToOrder, emitToUser, emitToAdmins } from '../socket.js'

// GET /api/chat/:orderId — full message thread for an order
export async function listMessages(req, res) {
  try {
    const order = await store.findOrderById(req.params.orderId)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (req.user.role === 'client' && String(order.clientId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not your conversation' })
    }
    const messages = await store.listMessages(req.params.orderId)
    return res.json({ messages, order })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load messages', detail: err.message })
  }
}

// POST /api/chat/:orderId — send a message (text | pin_request | call)
export async function sendMessage(req, res) {
  try {
    const { body, msgType } = req.body || {}
    const order = await store.findOrderById(req.params.orderId)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (req.user.role === 'client' && String(order.clientId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not your conversation' })
    }
    if (!body && !msgType) return res.status(400).json({ error: 'Message body required' })

    const message = await store.createMessage({
      orderId: req.params.orderId,
      senderId: req.user._id,
      senderRole: req.user.role,
      body: body || '',
      msgType: msgType || 'text'
    })

    // Real-time delivery to the order room
    emitToOrder(order._id, 'chat:message', message)

    // Cross-notify the other party
    if (req.user.role === 'client') {
      const notif = await store.createNotification({
        recipientId: null, recipientRole: 'admin', type: 'chat',
        title: 'New Message', message: `${order.clientUsername}: ${(body || msgType || '').slice(0, 60)}`
      })
      emitToAdmins('notification', notif)
    } else {
      const notif = await store.createNotification({
        recipientId: order.clientId, recipientRole: 'client', type: 'chat',
        title: 'Message from CALMER', message: (body || msgType || '').slice(0, 60)
      })
      emitToUser(order.clientId, 'notification', notif)
    }

    return res.status(201).json({ message })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send message', detail: err.message })
  }
}
