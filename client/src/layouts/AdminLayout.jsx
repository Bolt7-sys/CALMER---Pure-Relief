import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { onSocket } from '../lib/socket'
import { useToast } from '../components/Toast'
import Logo from '../components/Logo'
import { InstallAppButton } from '../components/InstallApp'
import api from '../lib/api'

const NAV = [
  { to: '/admin', icon: 'fa-grip', label: 'Overview', end: true },
  { to: '/admin/orders', icon: 'fa-cart-shopping', label: 'Orders' },
  { to: '/admin/products', icon: 'fa-box', label: 'Products' },
  { to: '/admin/tracking', icon: 'fa-map-location-dot', label: 'Live Tracking' },
  { to: '/admin/chat', icon: 'fa-comments', label: 'Communications' },
  { to: '/admin/analytics', icon: 'fa-chart-line', label: 'Analytics' }
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    api.get('/notifications').then(({ data }) => setUnread(data.notifications.filter(n => !n.read).length)).catch(() => {})

    // Attach real-time listeners the moment a socket exists (no mount-order race)
    let detach = null
    const unsub = onSocket((socket) => {
      const onNotif = (n) => { setUnread(u => u + 1); toast.notify(`${n.title}: ${n.message}`) }
      const onNewOrder = () => toast.success('New order received!')
      socket.on('notification', onNotif)
      socket.on('order:new', onNewOrder)
      detach = () => { socket.off('notification', onNotif); socket.off('order:new', onNewOrder) }
    })
    return () => { unsub(); if (detach) detach() }
  }, [])

  const Sidebar = (
    <aside className="w-64 flex-shrink-0 glass-strong border-r border-rich-gold/10 flex flex-col h-full">
      <div className="p-5 border-b border-rich-gold/10">
        <Logo size={40} subtitle="CANNABIS DELIVERY" />
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${isActive ? 'bg-gold-gradient text-black font-semibold' : 'text-soft-gold/70 hover:bg-white/5'}`}>
            <i className={`fa-solid ${n.icon} w-5`}></i>{n.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-rich-gold/10 space-y-3">
        {/* Admins can install CALMER on their phone too */}
        <InstallAppButton variant="full" className="!py-3 !text-sm" />
        <div className="card p-4 text-center">
          <div className="heading text-lg text-white">Stay Calm.<br />We Deliver.</div>
          <i className="fa-solid fa-cannabis text-rich-gold mt-2"></i>
        </div>
        <button onClick={() => { logout(); navigate('/auth') }} className="w-full btn-ghost py-2.5 text-sm text-red-400 border-red-400/20">
          <i className="fa-solid fa-arrow-right-from-bracket mr-2"></i>Log Out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="h-screen flex bg-dark-radial overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block h-full">{Sidebar}</div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full">{Sidebar}</div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <header className="glass-strong px-4 lg:px-6 py-3 flex items-center justify-between border-b border-rich-gold/10">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="lg:hidden w-10 h-10 rounded-full glass grid place-items-center text-soft-gold"><i className="fa-solid fa-bars"></i></button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <div className="lg:hidden"><InstallAppButton variant="compact" /></div>
            <button onClick={() => navigate('/admin/chat')} aria-label="Notifications" className="w-10 h-10 rounded-full glass grid place-items-center text-soft-gold relative">
              <i className="fa-solid fa-bell"></i>
              {unread > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gold-gradient text-black text-[10px] font-bold grid place-items-center">{unread > 99 ? '99+' : unread}</span>}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gold-gradient grid place-items-center text-black font-bold">{user?.username?.[7]?.toUpperCase() || 'A'}</div>
              <div className="hidden sm:block leading-tight">
                <div className="text-sm text-white font-semibold">{user?.username}</div>
                <div className="text-[10px] text-soft-gold/50">Super Administrator</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
