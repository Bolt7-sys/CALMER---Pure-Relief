import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { onSocket } from '../../lib/socket'
import { resolveImage } from '../../lib/images'
import MapView from '../../components/MapView'
import { toast } from '../../components/Toast'

const STEPS = [
  { key: 'processing', label: 'Confirmed', icon: 'fa-box' },
  { key: 'on_the_way', label: 'On the way', icon: 'fa-motorcycle' },
  { key: 'near', label: 'Near you', icon: 'fa-location-dot' },
  { key: 'delivered', label: 'Delivered', icon: 'fa-check' }
]
const PROGRESS = { processing: 0.08, on_the_way: 0.45, near: 0.8, delivered: 1 }

const HEADLINE = {
  processing: 'Your order is being prepared',
  on_the_way: 'Your order is on the way',
  near: 'Your rider is nearby!',
  delivered: 'Delivered!',
  cancelled: 'Order cancelled'
}

export default function Tracking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    let alive = true
    api.get(`/orders/${id}`).then(({ data }) => { if (alive) setOrder(data.order) }).catch(() => navigate('/orders'))
    // onSocket fires even if the socket connects after mount (fixes lost events)
    const off = onSocket((socket) => {
      socket.emit('order:join', id)
      const onStatus = (p) => {
        if (String(p.orderId) !== String(id)) return
        setOrder(o => o ? { ...o, deliveryStatus: p.deliveryStatus, estimatedDeliveryTime: p.estimatedDeliveryTime ?? o.estimatedDeliveryTime } : o)
        if (p.deliveryStatus === 'delivered') toast.success('Your order has been delivered!')
      }
      socket.on('order:status', onStatus)
      return () => { socket.emit('order:leave', id); socket.off('order:status', onStatus) }
    })
    return () => { alive = false; off?.() }
  }, [id])

  // Live ETA countdown ticking every 30s (only while order is active)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const etaMinutes = useMemo(() => {
    if (!order) return null
    if (order.deliveryStatus === 'delivered' || order.deliveryStatus === 'cancelled') return null
    const elapsed = Math.floor((now - new Date(order.createdAt).getTime()) / 60000)
    return Math.max(1, (order.estimatedDeliveryTime || 30) - elapsed)
  }, [order, now])

  if (!order) return <div className="py-20 text-center text-soft-gold/50"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div>

  const isCancelled = order.deliveryStatus === 'cancelled'
  const isDelivered = order.deliveryStatus === 'delivered'
  // For cancelled orders findIndex returns -1; clamp so the timeline never renders broken
  const currentIdx = Math.max(0, STEPS.findIndex(s => s.key === order.deliveryStatus))
  const progress = PROGRESS[order.deliveryStatus] ?? 0.1
  const subtotal = order.subtotal ?? order.items.reduce((s, it) => s + it.price * it.quantity, 0)
  const discount = order.discount || 0
  const deliveryFee = order.deliveryFee ?? Math.max(0, order.totalAmount - subtotal + discount)

  return (
    <div className="space-y-4 pb-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/orders')} aria-label="Back to orders" className="w-10 h-10 rounded-full glass grid place-items-center text-soft-gold"><i className="fa-solid fa-arrow-left"></i></button>
          <div>
            <div className="text-[11px] text-soft-gold/50">Order</div>
            <div className="font-mono text-sm text-rich-gold">{order.orderNumber}</div>
          </div>
        </div>
        {!isCancelled && (
          <button onClick={() => navigate(`/chat/${order._id}`)} className="btn-ghost px-4 py-2 text-sm">
            <i className="fa-solid fa-headset mr-1.5"></i>Support
          </button>
        )}
      </header>

      <div>
        <h1 className="heading text-2xl text-white">{HEADLINE[order.deliveryStatus] || HEADLINE.processing}</h1>
        <p className="text-xs text-soft-gold/50">
          {isCancelled ? (order.cancelReason || 'This order was cancelled. Items were restocked.') :
            isDelivered ? 'Enjoy — breathe, unwind, elevate.' : 'Our rider is heading to your location'}
        </p>
      </div>

      {isCancelled ? (
        <section id="cancelled-banner" className="card p-5 border-red-400/30 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-400/15 grid place-items-center text-red-400 text-2xl mb-3"><i className="fa-solid fa-ban"></i></div>
          <p className="text-sm text-white mb-1">This order was cancelled</p>
          <p className="text-[11px] text-soft-gold/50 mb-4">No charge applied. All items returned to stock.</p>
          <button onClick={() => navigate('/shop')} className="btn-gold px-6 py-2.5 text-sm">Shop Again</button>
        </section>
      ) : (
        <>
          {/* Timeline */}
          <section id="tracking-timeline" className="flex items-center justify-between px-1" aria-label="Delivery progress">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex flex-col items-center flex-1 relative">
                {i < STEPS.length - 1 && (
                  <div className={`absolute top-4 left-1/2 w-full h-0.5 ${i < currentIdx ? 'bg-gold-gradient' : 'bg-white/10'}`} />
                )}
                <div className={`relative z-10 w-8 h-8 rounded-full grid place-items-center text-xs ${i <= currentIdx ? 'bg-gold-gradient text-black' : 'glass text-soft-gold/40'} ${i === currentIdx && !isDelivered ? 'ring-4 ring-rich-gold/30 animate-pulse' : ''}`}>
                  <i className={`fa-solid ${s.icon}`}></i>
                </div>
                <span className={`text-[9px] mt-1.5 ${i <= currentIdx ? 'text-rich-gold' : 'text-soft-gold/40'}`}>{s.label}</span>
              </div>
            ))}
          </section>

          {/* ETA + rider card */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <div className="text-[10px] text-soft-gold/50 uppercase">{isDelivered ? 'Status' : 'Estimated delivery'}</div>
              {isDelivered ? (
                <div className="text-2xl font-bold text-emerald-400"><i className="fa-solid fa-circle-check mr-1"></i>Done</div>
              ) : (
                <>
                  <div className="text-2xl font-bold gold-text">{etaMinutes} min</div>
                  <div className="text-[10px] text-soft-gold/40">updates live</div>
                </>
              )}
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gold-gradient grid place-items-center text-black"><i className="fa-solid fa-user-astronaut"></i></div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">CALMER Rider</div>
                <div className="text-[11px] text-rich-gold"><i className="fa-solid fa-star"></i> 4.9</div>
              </div>
            </div>
          </div>

          {/* Map with route */}
          <MapView progress={progress} />

          {/* Call + chat quick actions */}
          {!isDelivered && (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate(`/chat/${order._id}?call=voice`)} className="card p-3.5 flex items-center justify-center gap-2 text-rich-gold hover:border-rich-gold/40 transition">
                <i className="fa-solid fa-phone"></i> Call Rider
              </button>
              <button onClick={() => navigate(`/chat/${order._id}`)} className="card p-3.5 flex items-center justify-center gap-2 text-rich-gold hover:border-rich-gold/40 transition">
                <i className="fa-solid fa-comment"></i> Chat
              </button>
            </div>
          )}
        </>
      )}

      {/* Order details */}
      <section id="order-details" className="card p-4">
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
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-soft-gold/60"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span><i className="fa-solid fa-tag mr-1"></i>{order.promoCode || 'Discount'}</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-soft-gold/60"><span>Delivery</span><span>{deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}</span></div>
          <div className="flex justify-between text-white font-bold pt-1 border-t border-rich-gold/10"><span>Total</span><span className="gold-text">${order.totalAmount.toFixed(2)}</span></div>
        </div>
        <div className="h-px bg-rich-gold/10 my-3" />
        <div className="text-xs text-soft-gold/60">
          <div className="flex items-start gap-2"><i className="fa-solid fa-location-dot text-rich-gold mt-0.5"></i><span>{order.deliveryAddress?.street}, {order.deliveryAddress?.city} {order.deliveryAddress?.postalCode}</span></div>
        </div>
      </section>

      {isDelivered && !order.rating && <RateOrder id={order._id} onRated={(r) => setOrder(o => ({ ...o, rating: r }))} />}
      {isDelivered && order.rating > 0 && (
        <div className="card p-4 text-center text-sm text-soft-gold/60">
          You rated this order {' '}
          {[1, 2, 3, 4, 5].map(n => <i key={n} className={`fa-solid fa-star text-sm ${n <= order.rating ? 'text-rich-gold' : 'text-white/15'}`}></i>)}
        </div>
      )}
    </div>
  )
}

function RateOrder({ id, onRated }) {
  const [hover, setHover] = useState(0)
  const [rating, setRating] = useState(0)
  const [busy, setBusy] = useState(false)
  async function submit(r) {
    if (busy) return
    setBusy(true); setRating(r)
    try {
      await api.patch(`/orders/${id}/rate`, { rating: r })
      onRated(r)
      toast.success('Thanks for your feedback!')
    } catch (e) {
      setRating(0)
      toast.error(e?.response?.data?.message || 'Could not submit rating')
    } finally { setBusy(false) }
  }
  return (
    <div className="card p-4 text-center">
      <h3 className="text-sm text-white mb-2">Rate your experience</h3>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} disabled={busy} aria-label={`Rate ${n} stars`} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => submit(n)}>
            <i className={`fa-solid fa-star text-2xl transition ${n <= (hover || rating) ? 'text-rich-gold' : 'text-white/15'}`}></i>
          </button>
        ))}
      </div>
    </div>
  )
}
