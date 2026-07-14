import { store } from '../data/store.js'
import { emitToUser, emitToAdmins, emitToOrder } from '../socket.js'
import { applyPromo } from '../utils/promo.js'

// Collision-resistant order number: CLM-YYYY-<base36 time><random> — unique even
// for simultaneous checkouts (the old 6-digit random could collide at scale).
function genOrderNumber() {
  const year = new Date().getFullYear()
  const t = Date.now().toString(36).toUpperCase().slice(-5)
  const r = Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, '0')
  return `CLM-${year}-${t}${r}`
}

const DELIVERY_FEE = 5
const MAX_QTY_PER_ITEM = 50

// POST /api/orders/quote — validate cart + promo BEFORE payment (server-priced)
export async function quoteOrder(req, res) {
  try {
    const { items, promoCode } = req.body || {}
    const priced = await priceItems(items)
    if (priced.error) return res.status(400).json({ error: priced.error })
    const subtotal = priced.subtotal
    let deliveryFee = DELIVERY_FEE, discount = 0, promo = null
    if (promoCode) {
      const result = applyPromo(promoCode, subtotal, deliveryFee)
      if (!result.valid) return res.status(400).json({ error: result.error })
      discount = result.discount; deliveryFee = result.deliveryFee; promo = { code: result.code, label: result.label }
    }
    const total = Math.max(0, +(subtotal - discount + deliveryFee).toFixed(2))
    return res.json({ subtotal, deliveryFee, discount, total, promo, items: priced.items })
  } catch (err) {
    return res.status(500).json({ error: 'Quote failed', detail: err.message })
  }
}

// SECURITY: recompute all prices from the database. NEVER trust client-sent prices —
// a tampered request could otherwise buy $70 concentrate for $0.01.
async function priceItems(items) {
  if (!Array.isArray(items) || items.length === 0) return { error: 'Your cart is empty.' }
  if (items.length > 40) return { error: 'Too many distinct items in one order.' }
  const priced = []
  let subtotal = 0
  for (const it of items) {
    const qty = Math.floor(Number(it.quantity))
    if (!Number.isFinite(qty) || qty < 1) return { error: `Invalid quantity for "${it.name || 'item'}".` }
    if (qty > MAX_QTY_PER_ITEM) return { error: `Max ${MAX_QTY_PER_ITEM} per product.` }
    const product = await store.findProductById(String(it.productId || ''))
    if (!product) return { error: `"${it.name || 'An item'}" is no longer available.` }
    if (Number(product.stock) < qty) return { error: `Only ${product.stock} left of "${product.name}".` }
    const line = { productId: String(product._id), name: product.name, quantity: qty, price: Number(product.price), imageUrl: product.imageUrl || '' }
    priced.push(line)
    subtotal += line.price * qty
  }
  return { items: priced, subtotal: +subtotal.toFixed(2) }
}

// POST /api/orders (client) — checkout
export async function createOrder(req, res) {
  try {
    const { items, paymentMethod, deliveryAddress, liveLocation, promoCode } = req.body || {}

    // 1) Server-side pricing (anti-tamper) + availability check
    const priced = await priceItems(items)
    if (priced.error) return res.status(400).json({ error: priced.error })

    // 2) Address sanity
    const addr = deliveryAddress || {}
    if (!String(addr.street || '').trim() || !String(addr.city || '').trim()) {
      return res.status(400).json({ error: 'Delivery street and city are required.' })
    }

    // 3) Promo (server-validated)
    let deliveryFee = DELIVERY_FEE, discount = 0, appliedPromo = ''
    if (promoCode) {
      const result = applyPromo(promoCode, priced.subtotal, deliveryFee)
      if (!result.valid) return res.status(400).json({ error: result.error })
      discount = result.discount; deliveryFee = result.deliveryFee; appliedPromo = result.code
    }
    const totalAmount = Math.max(0, +(priced.subtotal - discount + deliveryFee).toFixed(2))

    // 4) Atomically reserve stock — roll back everything on partial failure
    const reserved = []
    for (const line of priced.items) {
      const ok = await store.decrementStock(line.productId, line.quantity)
      if (!ok) {
        for (const r of reserved) await store.incrementStock(r.productId, r.quantity)
        return res.status(409).json({ error: `"${line.name}" just sold out. Please adjust your cart.` })
      }
      reserved.push(line)
    }

    // 5) Sanitize geolocation (reject NaN / out-of-range coordinates)
    const loc = sanitizeCoords(liveLocation)

    const order = await store.createOrder({
      orderNumber: genOrderNumber(),
      clientId: req.user._id,
      clientUsername: req.user.username,
      clientPhone: String(req.body.clientPhone || '').slice(0, 30),
      items: priced.items,
      subtotal: priced.subtotal,
      deliveryFee,
      promoCode: appliedPromo,
      discount,
      totalAmount,
      paymentStatus: 'paid',
      paymentMethod: ['card', 'wallet', 'cash'].includes(paymentMethod) ? paymentMethod : 'card',
      deliveryStatus: 'processing',
      deliveryAddress: {
        street: String(addr.street).slice(0, 120), city: String(addr.city).slice(0, 60),
        postalCode: String(addr.postalCode || '').slice(0, 20), notes: String(addr.notes || '').slice(0, 300)
      },
      liveLocation: loc ? { ...loc, pinned: true, timestamp: new Date() } : { pinned: false },
      estimatedDeliveryTime: 25,
      statusHistory: [{ status: 'processing', at: new Date() }]
    })

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

function sanitizeCoords(loc) {
  if (!loc) return null
  const lat = Number(loc.latitude), lng = Number(loc.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { latitude: lat, longitude: lng }
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

// Legal transitions — prevents nonsense like delivered -> processing,
// or updating a cancelled order back to life.
const TRANSITIONS = {
  processing: ['on_the_way', 'near', 'delivered', 'cancelled'],
  on_the_way: ['near', 'delivered', 'cancelled'],
  near: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
}

// PATCH /api/orders/:id/status (admin)
export async function updateStatus(req, res) {
  try {
    const { deliveryStatus, estimatedDeliveryTime } = req.body || {}
    const valid = ['processing', 'on_the_way', 'near', 'delivered', 'cancelled']
    if (!valid.includes(deliveryStatus)) return res.status(400).json({ error: 'Invalid status' })

    const current = await store.findOrderById(req.params.id)
    if (!current) return res.status(404).json({ error: 'Order not found' })
    if (current.deliveryStatus === deliveryStatus) return res.json({ order: current }) // idempotent
    if (!TRANSITIONS[current.deliveryStatus]?.includes(deliveryStatus)) {
      return res.status(400).json({ error: `Cannot go from "${current.deliveryStatus}" to "${deliveryStatus}".` })
    }

    const patch = {
      deliveryStatus,
      statusHistory: [...(current.statusHistory || []), { status: deliveryStatus, at: new Date() }]
    }
    if (deliveryStatus === 'delivered') { patch.deliveredAt = new Date(); patch.estimatedDeliveryTime = 0 }
    if (deliveryStatus === 'cancelled') { patch.cancelledAt = new Date(); patch.cancelReason = 'Cancelled by CALMER' }
    if (estimatedDeliveryTime != null && Number.isFinite(Number(estimatedDeliveryTime))) {
      patch.estimatedDeliveryTime = Math.max(0, Math.min(240, Number(estimatedDeliveryTime)))
    }
    const order = await store.updateOrder(req.params.id, patch)

    // Restock on admin cancel
    if (deliveryStatus === 'cancelled') {
      for (const it of order.items || []) await store.incrementStock(it.productId, Number(it.quantity) || 0)
    }

    const labels = {
      processing: 'is being prepared',
      on_the_way: 'is on the way',
      near: 'is arriving soon',
      delivered: 'has been delivered',
      cancelled: 'has been cancelled'
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

// PATCH /api/orders/:id/cancel (client) — only while still "processing"
export async function cancelOrder(req, res) {
  try {
    const order = await store.findOrderById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (String(order.clientId) !== String(req.user._id)) return res.status(403).json({ error: 'Not your order' })
    if (order.deliveryStatus !== 'processing') {
      return res.status(400).json({ error: 'Order is already out for delivery and can no longer be cancelled.' })
    }
    const updated = await store.updateOrder(order._id, {
      deliveryStatus: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: String(req.body?.reason || 'Cancelled by customer').slice(0, 200),
      statusHistory: [...(order.statusHistory || []), { status: 'cancelled', at: new Date() }]
    })
    // Return reserved stock to the shelf
    for (const it of order.items || []) await store.incrementStock(it.productId, Number(it.quantity) || 0)

    const notif = await store.createNotification({
      recipientId: null, recipientRole: 'admin', type: 'order_status',
      title: 'Order Cancelled', message: `${order.clientUsername} cancelled ${order.orderNumber}.`
    })
    emitToAdmins('notification', notif)
    emitToOrder(order._id, 'order:status', { orderId: order._id, deliveryStatus: 'cancelled' })
    return res.json({ order: updated })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to cancel order', detail: err.message })
  }
}

// PATCH /api/orders/:id/location — rider live location (admin) or client pin
export async function updateLocation(req, res) {
  try {
    const loc = sanitizeCoords(req.body || {})
    if (!loc) return res.status(400).json({ error: 'Valid latitude and longitude required' })

    const order = await store.findOrderById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    // Clients may only touch their own order's pin
    if (req.user.role === 'client' && String(order.clientId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not your order' })
    }

    const patch = {}
    if (req.body.target === 'client') {
      patch.liveLocation = { ...loc, pinned: true, timestamp: new Date() }
    } else {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only CALMER riders update rider location' })
      patch.riderLocation = { ...loc, timestamp: new Date() }
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

// PATCH /api/orders/:id/rate (client) — only own + delivered + not yet rated
export async function rateOrder(req, res) {
  try {
    const rating = Number(req.body?.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be a whole number 1-5' })
    const order = await store.findOrderById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (String(order.clientId) !== String(req.user._id)) return res.status(403).json({ error: 'Not your order' })
    if (order.deliveryStatus !== 'delivered') return res.status(400).json({ error: 'You can rate after delivery.' })
    if (order.rating) return res.status(400).json({ error: 'Already rated. Thank you!' })
    const updated = await store.updateOrder(order._id, {
      rating, ratingComment: String(req.body?.comment || '').slice(0, 400)
    })
    return res.json({ order: updated })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to rate order', detail: err.message })
  }
}
