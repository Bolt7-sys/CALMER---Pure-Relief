import mongoose from 'mongoose'

const { Schema, model } = mongoose

const userSchema = new Schema({
  username: { type: String, unique: true, required: true }, // @username or @admin-username
  passkey: { type: String, required: true },                // hashed CALMER passkey
  role: { type: String, enum: ['client', 'admin'], default: 'client' },
  fullName: String,
  email: String,
  phone: String,
  favorites: { type: [String], default: [] }, // product ids the user hearted
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

const productSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  category: { type: String, required: true }, // Flower, Edibles, Oils, Vapes, Concentrates, Accessories
  price: { type: Number, required: true },
  thcContent: String,
  cbdContent: String,
  imageUrl: String,
  stock: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false }
}, { timestamps: true })

const orderSchema = new Schema({
  orderNumber: { type: String, unique: true, required: true }, // CLM-YYYY-XXXXXX
  clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  clientUsername: String,
  clientPhone: String,
  items: [{
    productId: String,
    name: String,
    quantity: Number,
    price: Number,
    imageUrl: String
  }],
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'paid' },
  paymentMethod: String,
  deliveryStatus: { type: String, enum: ['processing', 'on_the_way', 'near', 'delivered', 'cancelled'], default: 'processing' },
  deliveryAddress: { street: String, city: String, postalCode: String, notes: String },
  liveLocation: { latitude: Number, longitude: Number, pinned: { type: Boolean, default: false }, timestamp: Date },
  riderLocation: { latitude: Number, longitude: Number, timestamp: Date },
  estimatedDeliveryTime: { type: Number, default: 25 },
  subtotal: Number,
  deliveryFee: { type: Number, default: 5 },
  promoCode: String,
  discount: { type: Number, default: 0 },
  statusHistory: [{ status: String, at: Date }],
  deliveredAt: Date,
  cancelledAt: Date,
  cancelReason: String,
  rating: Number,
  ratingComment: String
}, { timestamps: true })

const notificationSchema = new Schema({
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // null = broadcast
  recipientRole: String, // 'client' | 'admin' | null
  type: String,
  title: String,
  message: String,
  read: { type: Boolean, default: false },       // for direct (recipientId) notifications
  readBy: { type: [String], default: [] }        // per-user reads for role broadcasts (recipientId null)
}, { timestamps: true })

const messageSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User' },
  senderRole: String, // 'client' | 'admin'
  body: String,
  msgType: { type: String, default: 'text' }, // text | system | pin_request | call
  read: { type: Boolean, default: false }
}, { timestamps: true })

export const User = model('User', userSchema)
export const Product = model('Product', productSchema)
export const Order = model('Order', orderSchema)
export const Notification = model('Notification', notificationSchema)
export const Message = model('Message', messageSchema)
