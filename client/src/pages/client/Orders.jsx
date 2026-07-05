import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { resolveImage } from '../../lib/images'

const STATUS = {
  processing: { label: 'Preparing', color: 'text-amber-400', bg: 'bg-amber-400/15', icon: 'fa-box' },
  on_the_way: { label: 'On the way', color: 'text-blue-400', bg: 'bg-blue-400/15', icon: 'fa-truck-fast' },
  near: { label: 'Arriving soon', color: 'text-purple-400', bg: 'bg-purple-400/15', icon: 'fa-location-arrow' },
  delivered: { label: 'Delivered', color: 'text-emerald-400', bg: 'bg-emerald-400/15', icon: 'fa-circle-check' }
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/orders').then(({ data }) => setOrders(data.orders)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="heading text-2xl text-white">My Orders</h1>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-soft-gold/50">
          <i className="fa-solid fa-box-open text-5xl mb-4"></i>
          <p className="mb-4">No orders yet</p>
          <button onClick={() => navigate('/shop')} className="btn-gold px-6 py-2.5">Start Shopping</button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => {
            const s = STATUS[o.deliveryStatus] || STATUS.processing
            return (
              <button key={o._id} onClick={() => navigate(`/track/${o._id}`)} className="card p-4 w-full text-left hover:border-rich-gold/40 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-rich-gold">{o.orderNumber}</span>
                  <span className={`text-[10px] px-2 py-1 rounded-full ${s.bg} ${s.color} font-semibold`}><i className={`fa-solid ${s.icon} mr-1`}></i>{s.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {o.items.slice(0, 3).map((it, i) => (
                      <img key={i} src={resolveImage(it.imageUrl)} alt="" className="w-11 h-11 rounded-xl object-cover ring-2 ring-black" />
                    ))}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white">{o.items.length} item{o.items.length > 1 ? 's' : ''}</div>
                    <div className="text-[11px] text-soft-gold/50">{new Date(o.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className="gold-text font-bold">${o.totalAmount.toFixed(2)}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
