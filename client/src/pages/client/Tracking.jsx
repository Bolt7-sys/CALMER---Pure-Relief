import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { getSocket } from '../../lib/socket'
import { resolveImage } from '../../lib/images'
import MapView from '../../components/MapView'

const STEPS = [
  { key: 'processing', label: 'Confirmed', icon: 'fa-box' },
  { key: 'on_the_way', label: 'On the way', icon: 'fa-motorcycle' },
  { key: 'near', label: 'Near you', icon: 'fa-location-dot' },
  { key: 'delivered', label: 'Delivered', icon: 'fa-check' }
]
const PROGRESS = { processing: 0.08, on_the_way: 0.45, near: 0.8, delivered: 1 }

export default function Tracking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data.order)).catch(() => navigate('/orders'))
    const socket = getSocket()
    if (socket) {
      socket.emit('order:join', id)
      const onStatus = (p) => { if (p.orderId === id || String(p.orderId) === String(id)) setOrder(o => ({ ...o, deliveryStatus: p.deliveryStatus, estimatedDeliveryTime: p.estimatedDeliveryTime ?? o.estimatedDeliveryTime })) }
      socket.on('order:status', onStatus)
      return () => { socket.emit('order:leave', id); socket.off('order:status', onStatus) }
    }
  }, [id])

  if (!order) return <div className="py-20 text-center text-soft-gold/50"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div>

  const currentIdx = STEPS.findIndex(s => s.key === order.deliveryStatus)
  const progress = PROGRESS[order.deliveryStatus] ?? 0.1

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/orders')} className="w-10 h-10 rounded-full glass grid place-items-center text-soft-gold"><i className="fa-solid fa-arrow-left"></i></button>
          <div>
            <div className="text-[11px] text-soft-gold/50">Order</div>
            <div className="font-mono text-sm text-rich-gold">{order.orderNumber}</div>
          </div>
        </div>
        <button onClick={() => navigate(`/chat/${order._id}`)} className="btn-ghost px-4 py-2 text-sm">
          <i className="fa-solid fa-headset mr-1.5"></i>Support
        </button>
      </div>

      <div>
        <h1 className="heading text-2xl text-white">
          {order.deliveryStatus === 'delivered' ? 'Delivered!' : 'Your order is on the way'}
        </h1>
        <p className="text-xs text-soft-gold/50">Our rider is heading to your location</p>
      </div>

      {/* Timeline */}
      <div className="flex items-center justify-between px-1">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex flex-col items-center flex-1 relative">
            {i < STEPS.length - 1 && (
              <div className={`absolute top-4 left-1/2 w-full h-0.5 ${i < currentIdx ? 'bg-gold-gradient' : 'bg-white/10'}`} />
            )}
            <div className={`relative z-10 w-8 h-8 rounded-full grid place-items-center text-xs ${i <= currentIdx ? 'bg-gold-gradient text-black' : 'glass text-soft-gold/40'} ${i === currentIdx ? 'ring-4 ring-rich-gold/30 animate-pulse' : ''}`}>
              <i className={`fa-solid ${s.icon}`}></i>
            </div>
            <span className={`text-[9px] mt-1.5 ${i <= currentIdx ? 'text-rich-gold' : 'text-soft-gold/40'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ETA + rider card */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="text-[10px] text-soft-gold/50 uppercase">Estimated delivery</div>
          <div className="text-2xl font-bold gold-text">{order.estimatedDeliveryTime} min</div>
          <div className="text-[10px] text-soft-gold/40">2.4 km away</div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gold-gradient grid place-items-center text-black"><i className="fa-solid fa-user-astronaut"></i></div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">Alex Rider</div>
            <div className="text-[11px] text-rich-gold"><i className="fa-solid fa-star"></i> 4.9</div>
          </div>
        </div>
      </div>

      {/* Map with route */}
      <MapView progress={progress} />

      {/* Call + chat quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate(`/chat/${order._id}?call=voice`)} className="card p-3.5 flex items-center justify-center gap-2 text-rich-gold hover:border-rich-gold/40 transition">
          <i className="fa-solid fa-phone"></i> Call Rider
        </button>
        <button onClick={() => navigate(`/chat/${order._id}`)} className="card p-3.5 flex items-center justify-center gap-2 text-rich-gold hover:border-rich-gold/40 transition">
          <i className="fa-solid fa-comment"></i> Chat
        </button>
      </div>

      {/* Order details */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Order Details</h3>
        <div className="space-y-2">
          {order.items.map((it, i) => (
            <div key={i} className="flex items-center gap-3">
              <img src={resolveImage(it.imageUrl)} alt="" className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1">
                <div className="text-sm text-white">{it.name}</div>
                <div className="text-[11px] text-soft-gold/50">Qty: {it.quantity}</div>
              </div>
              <span className="text-rich-gold font-semibold">${(it.price * it.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="h-px bg-rich-gold/10 my-3" />
        <div className="text-xs text-soft-gold/60 space-y-1">
          <div className="flex items-start gap-2"><i className="fa-solid fa-location-dot text-rich-gold mt-0.5"></i><span>{order.deliveryAddress?.street}, {order.deliveryAddress?.city} {order.deliveryAddress?.postalCode}</span></div>
        </div>
      </div>

      {order.deliveryStatus === 'delivered' && !order.rating && <RateOrder id={order._id} onRated={(r) => setOrder(o => ({ ...o, rating: r }))} />}
    </div>
  )
}

function RateOrder({ id, onRated }) {
  const [hover, setHover] = useState(0)
  const [rating, setRating] = useState(0)
  async function submit(r) {
    setRating(r)
    try { await api.patch(`/orders/${id}/rate`, { rating: r }); onRated(r) } catch {}
  }
  return (
    <div className="card p-4 text-center">
      <h3 className="text-sm text-white mb-2">Rate your experience</h3>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => submit(n)}>
            <i className={`fa-solid fa-star text-2xl ${n <= (hover || rating) ? 'text-rich-gold' : 'text-white/15'}`}></i>
          </button>
        ))}
      </div>
    </div>
  )
}
