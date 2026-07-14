import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { resolveImage } from '../../lib/images'
import { onSocket } from '../../lib/socket'
import { toast } from '../../components/Toast'

const STATUS = {
  processing: { label: 'Preparing', color: 'text-amber-400', bg: 'bg-amber-400/15', icon: 'fa-box' },
  on_the_way: { label: 'On the way', color: 'text-blue-400', bg: 'bg-blue-400/15', icon: 'fa-truck-fast' },
  near: { label: 'Arriving soon', color: 'text-purple-400', bg: 'bg-purple-400/15', icon: 'fa-location-arrow' },
  delivered: { label: 'Delivered', color: 'text-emerald-400', bg: 'bg-emerald-400/15', icon: 'fa-circle-check' },
  cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-400/15', icon: 'fa-ban' }
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    api.get('/orders').then(({ data }) => { if (alive) setOrders(data.orders) }).finally(() => { if (alive) setLoading(false) })
    // Live status updates — onSocket handles the connect-after-mount race
    const off = onSocket((socket) => {
      const onStatus = (p) => setOrders(list => list.map(o =>
        String(o._id) === String(p.orderId) ? { ...o, deliveryStatus: p.deliveryStatus } : o
      ))
      socket.on('order:status', onStatus)
      return () => socket.off('order:status', onStatus)
    })
    return () => { alive = false; off?.() }
  }, [])

  async function cancelOrder(e, id) {
    e.stopPropagation()
    if (cancelling) return
    if (!window.confirm('Cancel this order? Items will be restocked and no charge applied.')) return
    setCancelling(id)
    try {
      const { data } = await api.patch(`/orders/${id}/cancel`)
      setOrders(list => list.map(o => String(o._id) === String(id) ? data.order : o))
      toast.success('Order cancelled')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not cancel — it may already be on the way')
    } finally {
      setCancelling(null)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="heading text-2xl text-white">My Orders</h1>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-24 skeleton" />)}</div>
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
            const cancelled = o.deliveryStatus === 'cancelled'
            return (
              <div key={o._id} role="button" tabIndex={0}
                onClick={() => navigate(`/track/${o._id}`)}
                onKeyDown={e => { if (e.key === 'Enter') navigate(`/track/${o._id}`) }}
                className={`card card-lift p-4 w-full text-left cursor-pointer hover:border-rich-gold/40 transition ${cancelled ? 'opacity-70' : ''}`}>
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
                  <span className={`font-bold ${cancelled ? 'text-soft-gold/40 line-through' : 'gold-text'}`}>${o.totalAmount.toFixed(2)}</span>
                </div>
                {o.deliveryStatus === 'processing' && (
                  <div className="mt-3 pt-3 border-t border-rich-gold/10 flex justify-end">
                    <button onClick={e => cancelOrder(e, o._id)} disabled={cancelling === o._id}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-red-400/30 text-red-400 hover:bg-red-400/10 transition disabled:opacity-50">
                      {cancelling === o._id ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-ban mr-1"></i>Cancel order</>}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
