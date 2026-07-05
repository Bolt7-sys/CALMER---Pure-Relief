import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { resolveImage } from '../../lib/images'
import { useToast } from '../../components/Toast'
import { getSocket } from '../../lib/socket'

const STATUSES = [
  { key: 'processing', label: 'Preparing' },
  { key: 'on_the_way', label: 'On the way' },
  { key: 'near', label: 'Near you' },
  { key: 'delivered', label: 'Delivered' }
]
const FILTERS = [{ key: 'all', label: 'All' }, ...STATUSES]

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [active, setActive] = useState(null)
  const toast = useToast()
  const navigate = useNavigate()

  function load() {
    api.get('/orders', { params: filter !== 'all' ? { status: filter } : {} })
      .then(({ data }) => setOrders(data.orders)).catch(() => {})
  }
  useEffect(load, [filter])
  useEffect(() => {
    const s = getSocket(); if (!s) return
    const onNew = () => load()
    s.on('order:new', onNew)
    return () => s.off('order:new', onNew)
  }, [filter])

  async function updateStatus(order, status) {
    try {
      const { data } = await api.patch(`/orders/${order._id}/status`, { deliveryStatus: status })
      setOrders(prev => prev.map(o => o._id === order._id ? data.order : o))
      if (active?._id === order._id) setActive(data.order)
      toast.success(`Order marked "${STATUSES.find(s => s.key === status)?.label}"`)
    } catch { toast.error('Update failed') }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="heading text-3xl text-white">Orders</h1>
        <p className="text-sm text-soft-gold/50">Manage and update every delivery.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition ${filter === f.key ? 'chip-active' : 'chip text-soft-gold/70'}`}>{f.label}</button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {orders.map(o => (
          <div key={o._id} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-mono text-xs text-rich-gold">{o.orderNumber}</div>
                <div className="text-sm text-white">{o.clientUsername}</div>
              </div>
              <span className="gold-text font-bold">${o.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex -space-x-3 mb-3">
              {o.items.slice(0, 4).map((it, i) => <img key={i} src={resolveImage(it.imageUrl)} alt="" className="w-10 h-10 rounded-lg object-cover ring-2 ring-black" />)}
              <div className="w-10 h-10 rounded-lg glass grid place-items-center text-[10px] text-soft-gold/60 ring-2 ring-black">{o.items.length} items</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map(s => (
                <button key={s.key} onClick={() => updateStatus(o, s.key)}
                  className={`text-[10px] px-2.5 py-1.5 rounded-full transition ${o.deliveryStatus === s.key ? 'bg-gold-gradient text-black font-semibold' : 'chip text-soft-gold/60'}`}>{s.label}</button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setActive(o)} className="btn-ghost flex-1 py-2 text-xs">Details</button>
              <button onClick={() => navigate('/admin/chat')} className="btn-ghost flex-1 py-2 text-xs"><i className="fa-solid fa-comment mr-1"></i>Chat</button>
            </div>
          </div>
        ))}
        {orders.length === 0 && <div className="col-span-full text-center py-16 text-soft-gold/40"><i className="fa-solid fa-inbox text-4xl mb-2"></i><p>No orders</p></div>}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" onClick={() => setActive(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative glass-strong rounded-3xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading text-2xl text-white">{active.orderNumber}</h2>
              <button onClick={() => setActive(null)} className="w-9 h-9 rounded-full glass grid place-items-center text-soft-gold"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="space-y-2 mb-4">
              {active.items.map((it, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img src={resolveImage(it.imageUrl)} alt="" className="w-11 h-11 rounded-lg object-cover" />
                  <div className="flex-1"><div className="text-sm text-white">{it.name}</div><div className="text-[11px] text-soft-gold/50">Qty {it.quantity}</div></div>
                  <span className="text-rich-gold">${(it.price * it.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="card p-3 text-xs text-soft-gold/70 space-y-1">
              <div><i className="fa-solid fa-user text-rich-gold mr-2"></i>{active.clientUsername} · {active.clientPhone || 'no phone'}</div>
              <div><i className="fa-solid fa-location-dot text-rich-gold mr-2"></i>{active.deliveryAddress?.street}, {active.deliveryAddress?.city}</div>
              <div><i className="fa-solid fa-credit-card text-rich-gold mr-2"></i>{active.paymentMethod} · {active.paymentStatus}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
