import { store } from '../data/store.js'
import { emitToUser, emitToAdmins, emitToOrder } from '../socket.js'

function genOrderNumber() {
  const year = new Date().getFullYear()
  const rand = Math.floor(100000 + Math.random() * 900000)
  return `CLM-${year}-${rand}`
}

// POST /api/orders (client) — checkout
export async function createOrder(req, res) {
  try {
    const { items, paymentMethod, deliveryAddress, liveLocation } = req.body || {}
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' })
    }
    const totalAmount = items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0)

    const order = await store.createOrder({
      orderNumber: genOrderNumber(),
      clientId: req.user._id,
      clientUsername: req.user.username,
      clientPhone: req.body.clientPhone || '',
      items: items.map(it => ({
        productId: String(it.productId || ''), name: it.name,
        quantity: Number(it.quantity), price: Number(it.price), imageUrl: it.imageUrl || ''
      })),
      totalAmount,
      paymentStatus: 'paid',
      paymentMethod: paymentMethod || 'card',
      deliveryStatus: 'processing',
      deliveryAddress: deliveryAddress || {},
      liveLocation: liveLocation
        ? { ...liveLocation, pinned: true, timestamp: new Date() }
        : { pinned: false },
      estimatedDeliveryTime: 25
    })

    // Notify admins of a new order
    const notif = await store.createNotification({
      recipientId: null, recipientRole: 'admin', type: 'new_order',
      title: 'New Order Received',
      message: `${order.clientUsername} placed order ${order.orderNumber} — $${totalAmount.toFixed(2)}`
    })
    emitToAdmins('notification', notif)
    emitToAdmins('order:new', order)

    return res.status(201).json({ order })
  } catch (err) {
    return res.status(500).json({ error: 'Checkout failed', detail: err.message })
  }
}

// GET /api/orders — client sees own, admin sees all (?status=...)
export async function listOrders(req, res) {
  try {
    const opts = { status: req.query.status }
    if (req.user.role === 'client') opts.clientId = req.user._id
    const orders = await store.listOrders(opts)
    return res.json({ orders })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load orders', detail: err.message })
  }
}

// GET /api/orders/:id
export async function getOrder(req, res) {
  try {
    const order = await store.findOrderById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (req.user.role === 'client' && String(order.clientId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not your order' })
    }
    return res.json({ order })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load order', detail: err.message })
  }
}

// PATCH /api/orders/:id/status (admin) — update delivery status
export async function updateStatus(req, res) {
  try {
    const { deliveryStatus, estimatedDeliveryTime } = req.body || {}
    const valid = ['processing', 'on_the_way', 'near', 'delivered']
    if (!valid.includes(deliveryStatus)) return res.status(400).json({ error: 'Invalid status' })

    const patch = { deliveryStatus }
    if (estimatedDeliveryTime != null) patch.estimatedDeliveryTime = Number(estimatedDeliveryTime)
    const order = await store.updateOrder(req.params.id, patch)
    if (!order) return res.status(404).json({ error: 'Order not found' })

    const labels = {
      processing: 'is being prepared',
      on_the_way: 'is on the way',
      near: 'is arriving soon',
      delivered: 'has been delivered'
    }
    const notif = await store.createNotification({
      recipientId: order.clientId, recipientRole: 'client', type: 'order_status',
      title: 'Order Update', message: `Your order ${order.orderNumber} ${labels[deliveryStatus]}.`
    })
    emitToUser(order.clientId, 'notification', notif)
    emitToOrder(order._id, 'order:status', { orderId: order._id, deliveryStatus, estimatedDeliveryTime: order.estimatedDeliveryTime })

    return res.json({ order })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update status', detail: err.message })
  }
}

// PATCH /api/orders/:id/location — update rider live location (admin) or client pin
export async function updateLocation(req, res) {
  try {
    const { latitude, longitude, target } = req.body || {}
    if (latitude == null || longitude == null) return res.status(400).json({ error: 'latitude and longitude required' })

    const order = await store.findOrderById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found' })

    const patch = {}
    if (target === 'client') {
      patch.liveLocation = { latitude: Number(latitude), longitude: Number(longitude), pinned: true, timestamp: new Date() }
    } else {
      patch.riderLocation = { latitude: Number(latitude), longitude: Number(longitude), timestamp: new Date() }
    }
    const updated = await store.updateOrder(req.params.id, patch)
    emitToOrder(order._id, 'order:location', {
      orderId: order._id, riderLocation: updated.riderLocation, liveLocation: updated.liveLocation
    })
    return res.json({ order: updated })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update location', detail: err.message })
  }
}

// PATCH /api/orders/:id/rate (client)
export async function rateOrder(req, res) {
  try {
    const rating = Number(req.body?.rating)
    if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ error: 'Rating must be 1-5' })
    const order = await store.updateOrder(req.params.id, { rating })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    return res.json({ order })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to rate order', detail: err.message })
  }
}
