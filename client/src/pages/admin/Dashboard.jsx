import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { resolveImage } from '../../lib/images'
import { onSocket } from '../../lib/socket'
import MapView from '../../components/MapView'

const STATUS_BADGE = {
  processing: { t: 'PREPARING', c: 'bg-amber-400/20 text-amber-300' },
  on_the_way: { t: 'OUT FOR DELIVERY', c: 'bg-blue-400/20 text-blue-300' },
  near: { t: 'ARRIVING', c: 'bg-purple-400/20 text-purple-300' },
  delivered: { t: 'DELIVERED', c: 'bg-emerald-400/20 text-emerald-300' },
  cancelled: { t: 'CANCELLED', c: 'bg-red-400/20 text-red-300' }
}

const fmtMoney = (n) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [orders, setOrders] = useState([])
  const navigate = useNavigate()

  function refresh() {
    api.get('/analytics/overview').then(({ data }) => setData(data)).catch(() => {})
    api.get('/orders').then(({ data }) => setOrders(data.orders)).catch(() => {})
  }

  useEffect(() => {
    refresh()
    // Live-refresh KPIs when new orders arrive or statuses change
    const off = onSocket((socket) => {
      const onNew = () => refresh()
      const onStatus = (p) => {
        setOrders(list => list.map(o => String(o._id) === String(p.orderId) ? { ...o, deliveryStatus: p.deliveryStatus } : o))
        api.get('/analytics/overview').then(({ data }) => setData(data)).catch(() => {})
      }
      socket.on('order:new', onNew)
      socket.on('order:status', onStatus)
      return () => { socket.off('order:new', onNew); socket.off('order:status', onStatus) }
    })
    return () => off?.()
  }, [])

  const t = data?.totals || {}
  const lowStock = data?.lowStock || []
  const kpis = [
    { label: "Today's Revenue", value: fmtMoney(t.todayRevenue), icon: 'fa-dollar-sign', sub: `Total: ${fmtMoney(t.revenue)}`, subClass: 'text-soft-gold/50' },
    { label: 'Active Orders', value: t.activeOrders ?? 0, icon: 'fa-motorcycle', sub: `${t.deliveredOrders ?? 0} delivered · ${t.cancelledOrders ?? 0} cancelled`, subClass: 'text-soft-gold/50' },
    { label: 'Total Customers', value: t.clients ?? 0, icon: 'fa-users', sub: 'Registered', subClass: 'text-emerald-400' },
    { label: 'Avg Order Value', value: fmtMoney(t.avgOrderValue), icon: 'fa-chart-line', sub: `★ ${t.avgRating || '—'} avg rating`, subClass: 'text-rich-gold' }
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
          <div key={k.label} className="card card-lift p-5 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="text-[11px] text-soft-gold/50 uppercase tracking-wide">{k.label}</div>
                <div className="text-2xl xl:text-3xl font-bold text-white mt-1">{k.value}</div>
                <div className={`text-[11px] mt-1 truncate ${k.subClass}`}>{k.sub}</div>
              </div>
              <div className="w-11 h-11 rounded-full bg-gold-gradient grid place-items-center text-black flex-shrink-0"><i className={`fa-solid ${k.icon}`}></i></div>
            </div>
          </div>
        ))}
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <section id="low-stock-alert" className="card p-4 border-amber-400/30">
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-triangle-exclamation text-amber-400"></i>
            <h2 className="text-sm font-semibold text-white">Low Stock Alert</h2>
            <button onClick={() => navigate('/admin/products')} className="ml-auto text-xs text-rich-gold">Manage products <i className="fa-solid fa-chevron-right text-[10px]"></i></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(p => (
              <span key={p.id} className={`text-[11px] px-2.5 py-1 rounded-full ${p.stock === 0 ? 'bg-red-400/15 text-red-300' : 'bg-amber-400/15 text-amber-300'}`}>
                {p.name} · {p.stock === 0 ? 'OUT' : `${p.stock} left`}
              </span>
            ))}
          </div>
        </section>
      )}

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
