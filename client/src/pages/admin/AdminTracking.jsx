import { useEffect, useState } from 'react'
import api from '../../lib/api'
import MapView from '../../components/MapView'
import { useToast } from '../../components/Toast'
import { onSocket } from '../../lib/socket'

const STATUSES = [
  { key: 'processing', label: 'Preparing', p: 0.08 },
  { key: 'on_the_way', label: 'On the way', p: 0.45 },
  { key: 'near', label: 'Near you', p: 0.8 },
  { key: 'delivered', label: 'Delivered', p: 1 }
]
// Mirrors the server state machine so the UI never offers illegal jumps
const TRANSITIONS = {
  processing: ['on_the_way', 'near', 'delivered'],
  on_the_way: ['near', 'delivered'],
  near: ['delivered'],
  delivered: [],
  cancelled: []
}

export default function AdminTracking() {
  const [orders, setOrders] = useState([])
  const [selected, setSelected] = useState(null)
  const toast = useToast()

  function load() {
    api.get('/orders').then(({ data }) => {
      // Cancelled orders don't need tracking either
      const active = data.orders.filter(o => !['delivered', 'cancelled'].includes(o.deliveryStatus))
      setOrders(active)
      setSelected(s => active.find(o => o._id === s?._id) || active[0] || null)
    }).catch(() => {})
  }
  useEffect(() => {
    load()
    // Refresh list live when orders arrive or change status elsewhere
    const off = onSocket((socket) => {
      const refresh = () => load()
      socket.on('order:new', refresh)
      socket.on('order:status', refresh)
      return () => { socket.off('order:new', refresh); socket.off('order:status', refresh) }
    })
    return () => off?.()
  }, [])

  async function setStatus(status) {
    if (!selected || selected.deliveryStatus === status) return
    try {
      const { data } = await api.patch(`/orders/${selected._id}/status`, { deliveryStatus: status })
      setSelected(data.order); load()
      toast.success('Status updated & customer notified')
    } catch (err) { toast.error(err?.response?.data?.message || 'Update failed') }
  }

  const progress = STATUSES.find(s => s.key === selected?.deliveryStatus)?.p ?? 0.1

  return (
    <div className="space-y-5">
      <div>
        <h1 className="heading text-3xl text-white">Live Tracking</h1>
        <p className="text-sm text-soft-gold/50">Monitor active deliveries in real time.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Active deliveries list */}
        <div className="space-y-2">
          <h2 className="text-sm text-soft-gold/60 uppercase tracking-wide">Active Deliveries ({orders.length})</h2>
          {orders.map(o => (
            <button key={o._id} onClick={() => setSelected(o)}
              className={`card w-full p-3 text-left transition ${selected?._id === o._id ? 'border-rich-gold/50 shadow-gold' : 'hover:border-rich-gold/20'}`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-rich-gold">{o.orderNumber}</span>
                <span className="text-[10px] text-soft-gold/50">{STATUSES.find(s => s.key === o.deliveryStatus)?.label}</span>
              </div>
              <div className="text-sm text-white mt-1">{o.clientUsername}</div>
              <div className="text-[11px] text-soft-gold/50">{o.deliveryAddress?.city || 'Unknown'} · ${o.totalAmount.toFixed(2)}</div>
            </button>
          ))}
          {orders.length === 0 && <div className="card p-6 text-center text-soft-gold/40 text-sm">No active deliveries</div>}
        </div>

        {/* Map + controls */}
        <div className="lg:col-span-2 space-y-4">
          <MapView progress={progress} height={400} />
          {selected && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-mono text-xs text-rich-gold">{selected.orderNumber}</div>
                  <div className="text-sm text-white">{selected.clientUsername}</div>
                </div>
                <div className="text-right text-xs text-soft-gold/50">
                  ETA {selected.estimatedDeliveryTime} min
                </div>
              </div>
              <div className="text-[11px] text-soft-gold/50 uppercase mb-2">Update Status (notifies customer)</div>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(s => {
                  const isCurrent = selected.deliveryStatus === s.key
                  const allowed = (TRANSITIONS[selected.deliveryStatus] || []).includes(s.key)
                  return (
                    <button key={s.key} onClick={() => allowed && setStatus(s.key)} disabled={!isCurrent && !allowed}
                      className={`text-xs px-3 py-2 rounded-full transition ${isCurrent ? 'bg-gold-gradient text-black font-semibold' : allowed ? 'chip text-soft-gold/60 hover:bg-white/10' : 'chip text-soft-gold/25 cursor-not-allowed'}`}>{s.label}</button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
