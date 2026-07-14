import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { resolveImage } from '../../lib/images'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'

const GOLD = ['#FFD700', '#D4AF37', '#B8860B', '#FFC107', '#8B6914']

export default function Analytics() {
  const [data, setData] = useState(null)

  useEffect(() => { api.get('/analytics/overview').then(({ data }) => setData(data)).catch(() => {}) }, [])

  if (!data) return <div className="py-20 text-center text-soft-gold/50"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div>

  const t = data.totals
  const cards = [
    { label: 'Total Revenue', value: `$${t.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: 'fa-sack-dollar' },
    { label: "Today's Revenue", value: `$${(t.todayRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: 'fa-calendar-day' },
    { label: 'Avg Order Value', value: `$${(t.avgOrderValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: 'fa-receipt' },
    { label: 'Avg Rating', value: t.avgRating || '—', icon: 'fa-star' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading text-3xl gold-text">Analytics & Insights</h1>
        <p className="text-sm text-soft-gold/50">Performance overview and actionable insights.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gold-gradient grid place-items-center text-black text-lg"><i className={`fa-solid ${c.icon}`}></i></div>
            <div>
              <div className="text-[11px] text-soft-gold/50 uppercase">{c.label}</div>
              <div className="text-2xl font-bold text-white">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="xl:col-span-2 card p-5">
          <h2 className="text-sm text-soft-gold/60 uppercase tracking-wide mb-4">Revenue Overview (7 days)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.revenueByDay}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFD700" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#8a7a4d', fontSize: 10 }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8a7a4d', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#161310', border: '1px solid rgba(255,215,0,.2)', borderRadius: 12, color: '#EDE7DA' }} />
              <Area type="monotone" dataKey="amount" stroke="#FFD700" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown pie */}
        <div className="card p-5">
          <h2 className="text-sm text-soft-gold/60 uppercase tracking-wide mb-4">Sales Breakdown</h2>
          {data.categoryDistribution.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.categoryDistribution} dataKey="count" nameKey="category" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {data.categoryDistribution.map((_, i) => <Cell key={i} fill={GOLD[i % GOLD.length]} stroke="#0A0A0A" strokeWidth={2} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#161310', border: '1px solid rgba(255,215,0,.2)', borderRadius: 12, color: '#EDE7DA' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[260px] grid place-items-center text-soft-gold/40 text-sm">No data</div>}
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {data.categoryDistribution.map((c, i) => (
              <span key={c.category} className="text-[11px] text-soft-gold/60 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: GOLD[i % GOLD.length] }} />{c.category}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="card p-5">
        <h2 className="text-sm text-soft-gold/60 uppercase tracking-wide mb-4">Best Selling Products</h2>
        {data.topProducts.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.topProducts}>
              <XAxis dataKey="name" tick={{ fill: '#8a7a4d', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8a7a4d', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(255,215,0,.06)' }} contentStyle={{ background: '#161310', border: '1px solid rgba(255,215,0,.2)', borderRadius: 12, color: '#EDE7DA' }} />
              <Bar dataKey="qty" radius={[8, 8, 0, 0]} fill="#FFD700" />
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="h-[100px] grid place-items-center text-soft-gold/40 text-sm">No sales yet</div>}
      </div>

      {/* Extra stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Active Orders', value: t.activeOrders, icon: 'fa-truck-fast' },
          { label: 'Delivered', value: t.deliveredOrders, icon: 'fa-circle-check' },
          { label: 'Cancelled', value: t.cancelledOrders ?? 0, icon: 'fa-ban' },
          { label: 'Customers', value: t.clients, icon: 'fa-users' }
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <i className={`fa-solid ${s.icon} text-rich-gold text-xl`}></i>
            <div className="text-xl font-bold text-white mt-2">{s.value}</div>
            <div className="text-[11px] text-soft-gold/50">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
