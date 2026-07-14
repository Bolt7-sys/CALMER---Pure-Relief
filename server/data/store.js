// Unified data store: uses MongoDB (Mongoose) when connected, otherwise an
// in-memory fallback with the SAME async interface. Guarantees the app runs
// on any host (Netlify, Pandastack, local) even without a Mongo instance.

import { usingMongo } from '../config/db.js'
import { User, Product, Order, Notification, Message } from '../models/index.js'

// ---- In-memory collections ----
const mem = { users: [], products: [], orders: [], notifications: [], messages: [] }
let idc = 1
const oid = () => (Date.now().toString(16) + (idc++).toString(16).padStart(6, '0')).slice(-24).padStart(24, '0')

function clone(o) { return JSON.parse(JSON.stringify(o)) }
function matches(doc, q) {
  return Object.entries(q).every(([k, v]) => {
    if (v && typeof v === 'object' && '$in' in v) return v.$in.map(String).includes(String(doc[k]))
    if (v === null) return doc[k] == null || doc[k] === null
    return String(doc[k]) === String(v)
  })
}

// Generic memory operations
function memCreate(coll, data) {
  const doc = { _id: oid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data }
  mem[coll].push(doc); return clone(doc)
}
function memFind(coll, q = {}, { sort, limit } = {}) {
  let res = mem[coll].filter(d => matches(d, q))
  if (sort) {
    const [key, dir] = Object.entries(sort)[0]
    res = res.sort((a, b) => (a[key] > b[key] ? 1 : -1) * dir)
  }
  if (limit) res = res.slice(0, limit)
  return clone(res)
}
function memFindOne(coll, q) { const d = mem[coll].find(x => matches(x, q)); return d ? clone(d) : null }
function memFindById(coll, id) { const d = mem[coll].find(x => String(x._id) === String(id)); return d ? clone(d) : null }
function memUpdate(coll, id, patch) {
  const d = mem[coll].find(x => String(x._id) === String(id)); if (!d) return null
  Object.assign(d, patch, { updatedAt: new Date().toISOString() }); return clone(d)
}
function memDelete(coll, id) { const i = mem[coll].findIndex(x => String(x._id) === String(id)); if (i >= 0) mem[coll].splice(i, 1); return true }

// ---- Public API (async, mirrors Mongoose) ----
export const store = {
  usingMongo: () => usingMongo,

  // USERS
  async createUser(d) { return usingMongo ? (await User.create(d)).toObject() : memCreate('users', d) },
  async findUserByUsername(u) { return usingMongo ? (await User.findOne({ username: u }))?.toObject() || null : memFindOne('users', { username: u }) },
  async findUserById(id) { return usingMongo ? (await User.findById(id))?.toObject() || null : memFindById('users', id) },
  async updateUser(id, patch) { return usingMongo ? (await User.findByIdAndUpdate(id, patch, { new: true }))?.toObject() || null : memUpdate('users', id, patch) },

  // PRODUCTS
  async createProduct(d) { return usingMongo ? (await Product.create(d)).toObject() : memCreate('products', d) },
  async listProducts(category) {
    const q = category && category !== 'All' ? { category } : {}
    if (usingMongo) return (await Product.find(q).sort({ isNewArrival: -1, featured: -1, createdAt: -1 })).map(x => x.toObject())
    return memFind('products', q, { sort: { createdAt: -1 } })
  },
  async findProductById(id) { return usingMongo ? (await Product.findById(id))?.toObject() || null : memFindById('products', id) },
  async updateProduct(id, patch) { return usingMongo ? (await Product.findByIdAndUpdate(id, patch, { new: true }))?.toObject() || null : memUpdate('products', id, patch) },
  async deleteProduct(id) { if (usingMongo) { await Product.findByIdAndDelete(id); return true } return memDelete('products', id) },
  // Atomically decrement stock; returns null if not enough stock (prevents overselling races)
  async decrementStock(id, qty) {
    if (usingMongo) {
      return (await Product.findOneAndUpdate(
        { _id: id, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true }
      ))?.toObject() || null
    }
    const d = mem.products.find(x => String(x._id) === String(id))
    if (!d || Number(d.stock) < qty) return null
    d.stock = Number(d.stock) - qty; d.updatedAt = new Date().toISOString()
    return clone(d)
  },
  async incrementStock(id, qty) {
    if (usingMongo) { return (await Product.findByIdAndUpdate(id, { $inc: { stock: qty } }, { new: true }))?.toObject() || null }
    const d = mem.products.find(x => String(x._id) === String(id))
    if (!d) return null
    d.stock = Number(d.stock) + qty; return clone(d)
  },

  // ORDERS
  async createOrder(d) { return usingMongo ? (await Order.create(d)).toObject() : memCreate('orders', d) },
  async listOrders({ clientId, status } = {}) {
    const q = {}; if (clientId) q.clientId = clientId; if (status && status !== 'all') q.deliveryStatus = status
    if (usingMongo) return (await Order.find(q).sort({ createdAt: -1 })).map(x => x.toObject())
    return memFind('orders', q, { sort: { createdAt: -1 } })
  },
  async findOrderById(id) { return usingMongo ? (await Order.findById(id))?.toObject() || null : memFindById('orders', id) },
  async updateOrder(id, patch) { return usingMongo ? (await Order.findByIdAndUpdate(id, patch, { new: true }))?.toObject() || null : memUpdate('orders', id, patch) },

  // NOTIFICATIONS
  async createNotification(d) { return usingMongo ? (await Notification.create(d)).toObject() : memCreate('notifications', d) },
  async listNotifications(userId, role) {
    const normalize = (n) => ({
      ...n,
      // effective read state for THIS user (broadcasts track per-user readBy)
      read: n.recipientId ? !!n.read : (n.readBy || []).map(String).includes(String(userId))
    })
    if (usingMongo) {
      const rows = await Notification.find({ $or: [{ recipientId: userId }, { recipientId: null, recipientRole: role }] }).sort({ createdAt: -1 }).limit(50)
      return rows.map(x => normalize(x.toObject()))
    }
    return memFind('notifications', {}, { sort: { createdAt: -1 } })
      .filter(n => String(n.recipientId) === String(userId) || (n.recipientId == null && n.recipientRole === role))
      .slice(0, 50).map(normalize)
  },
  // Per-user reads: direct notifications flip `read`; role broadcasts append userId to `readBy`
  // (fixes the bug where one admin reading a broadcast marked it read for ALL admins).
  async markNotificationRead(id, userId) {
    if (usingMongo) {
      const n = await Notification.findById(id); if (!n) return null
      if (n.recipientId) { n.read = true } else { if (!n.readBy?.includes(String(userId))) n.readBy = [...(n.readBy || []), String(userId)] }
      await n.save(); return n.toObject()
    }
    const n = mem.notifications.find(x => String(x._id) === String(id)); if (!n) return null
    if (n.recipientId) n.read = true
    else { n.readBy = n.readBy || []; if (!n.readBy.includes(String(userId))) n.readBy.push(String(userId)) }
    return clone(n)
  },
  async markAllRead(userId, role) {
    if (usingMongo) {
      await Notification.updateMany({ recipientId: userId }, { read: true })
      await Notification.updateMany({ recipientId: null, recipientRole: role }, { $addToSet: { readBy: String(userId) } })
      return true
    }
    mem.notifications.forEach(n => {
      if (String(n.recipientId) === String(userId)) n.read = true
      else if (n.recipientId == null && n.recipientRole === role) {
        n.readBy = n.readBy || []; if (!n.readBy.includes(String(userId))) n.readBy.push(String(userId))
      }
    }); return true
  },

  // MESSAGES
  async createMessage(d) { return usingMongo ? (await Message.create(d)).toObject() : memCreate('messages', d) },
  async listMessages(orderId) {
    if (usingMongo) return (await Message.find({ orderId }).sort({ createdAt: 1 })).map(x => x.toObject())
    return memFind('messages', { orderId }, { sort: { createdAt: 1 } })
  },
  async lastMessage(orderId) {
    if (usingMongo) return (await Message.findOne({ orderId }).sort({ createdAt: -1 }))?.toObject() || null
    const arr = memFind('messages', { orderId }, { sort: { createdAt: -1 } }); return arr[0] || null
  },

  // ANALYTICS helpers
  async countUsersByRole(role) {
    if (usingMongo) return await User.countDocuments({ role })
    return mem.users.filter(u => u.role === role).length
  }
}
