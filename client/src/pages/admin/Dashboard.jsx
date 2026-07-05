import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { resolveImage } from '../../lib/images'
import MapView from '../../components/MapView'

const STATUS_BADGE = {
  processing: { t: 'PREPARING', c: 'bg-amber-400/20 text-amber-300' },
  on_the_way: { t: 'OUT FOR DELIVERY', c: 'bg-blue-400/20 text-blue-300' },
  near: { t: 'ARRIVING', c: 'bg-purple-400/20 text-purple-300' },
  delivered: { t: 'DELIVERED', c: 'bg-emerald-400/20 text-emerald-300' }
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [orders, setOrders] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/analytics/overview').then(({ data }) => setData(data)).catch(() => {})
    api.get('/orders').then(({ data }) => setOrders(data.orders)).catch(() => {})
  }, [])

  const t = data?.totals || {}
  const kpis = [
    { label: "Today's Revenue", value: `$${(t.revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: 'fa-dollar-sign', sub: 'Total earnings' },
    { label: 'Active Orders', value: t.activeOrders ?? 0, icon: 'fa-motorcycle', sub: 'In progress' },
    { label: 'Total Customers', value: t.clients ?? 0, icon: 'fa-users', sub: 'Registered' },
    { label: 'Products', value: t.products ?? 0, icon: 'fa-box', sub: 'In catalog' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading text-3xl text-white">Dashboard Overview</h1>
        <p className="text-sm text-soft-gold/50">Welcome back, Admin. Here's what's happening today.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="card p-5 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] text-soft-gold/50 uppercase tracking-wide">{k.label}</div>
                <div className="text-2xl xl:text-3xl font-bold text-white mt-1">{k.value}</div>
                <div className="text-[11px] text-emerald-400 mt-1"><i className="fa-solid fa-arrow-trend-up mr-1"></i>{k.sub}</div>
              </div>
              <div className="w-11 h-11 rounded-full bg-gold-gradient grid place-items-center text-black flex-shrink-0"><i className={`fa-solid ${k.icon}`}></i></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-3 gap-4">
        {/* Live map */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="heading text-xl text-white">Live Delivery Map</h2>
            <button onClick={() => navigate('/admin/tracking')} className="text-xs text-rich-gold">Open tracking <i className="fa-solid fa-chevron-right text-[10px]"></i></button>
          </div>
          <MapView progress={0.5} height={360} />
        </div>

        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="heading text-xl text-white">Recent Orders</h2>
            <button onClick={() => navigate('/admin/orders')} className="text-xs text-rich-gold">View all</button>
          </div>
          <div className="card divide-y divide-rich-gold/5">
            {orders.slice(0, 6).map(o => {
              const b = STATUS_BADGE[o.deliveryStatus] || STATUS_BADGE.processing
              return (
                <button key={o._id} onClick={() => navigate('/admin/orders')} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition text-left">
                  <img src={resolveImage(o.items[0]?.imageUrl)} alt="" className="w-11 h-11 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{o.clientUsername}</div>
                    <div className="text-[11px] text-soft-gold/50 font-mono">{o.orderNumber}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-rich-gold font-semibold text-sm">${o.totalAmount.toFixed(2)}</div>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${b.c}`}>{b.t}</span>
                  </div>
                </button>
              )
            })}
            {orders.length === 0 && <div className="p-6 text-center text-soft-gold/40 text-sm">No orders yet</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
