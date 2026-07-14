import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { onSocket } from '../lib/socket'
import { useToast } from '../components/Toast'
import Logo from '../components/Logo'
import { InstallAppButton } from '../components/InstallApp'
import api from '../lib/api'

const NAV = [
  { to: '/', icon: 'fa-house', label: 'Home', end: true },
  { to: '/shop', icon: 'fa-bag-shopping', label: 'Shop' },
  { to: '/orders', icon: 'fa-box', label: 'Orders' },
  { to: '/profile', icon: 'fa-user', label: 'Account' },
  { to: '/cart', icon: 'fa-cart-shopping', label: 'Cart' }
]

export default function ClientLayout() {
  const { count } = useCart()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    api.get('/notifications').then(({ data }) => {
      setUnread(data.notifications.filter(n => !n.read).length)
    }).catch(() => {})

    // onSocket fires immediately if connected, or as soon as the socket is
    // created — fixes the race where this layout mounted before /auth/me
    // finished and real-time notifications were silently lost.
    let detach = null
    const unsub = onSocket((socket) => {
      const onNotif = (n) => {
        setUnread(u => u + 1)
        toast.notify(n.title + ': ' + n.message)
      }
      socket.on('notification', onNotif)
      detach = () => socket.off('notification', onNotif)
    })
    return () => { unsub(); if (detach) detach() }
  }, [])

  return (
    <div className="min-h-screen bg-dark-radial max-w-md mx-auto relative pb-28">
      {/* Top header */}
      <header className="sticky top-0 z-30 glass-strong px-4 py-3 pt-safe flex items-center justify-between">
        <Logo size={38} />
        <div className="flex items-center gap-2">
          <InstallAppButton variant="compact" />
          <button onClick={() => navigate('/shop')} aria-label="Search products"
            className="w-10 h-10 rounded-full glass grid place-items-center text-soft-gold">
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>
          <button onClick={() => { navigate('/notifications'); setUnread(0) }} aria-label="Notifications"
            className="w-10 h-10 rounded-full glass grid place-items-center text-soft-gold relative">
            <i className="fa-solid fa-bell"></i>
            {unread > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gold-gradient text-black text-[10px] font-bold grid place-items-center">{unread > 99 ? '99+' : unread}</span>}
          </button>
        </div>
      </header>

      <main key={location.pathname} className="px-4 pt-4">
        <Outlet />
      </main>

      {/* Bottom nav (safe-area aware for installed PWA on notch phones) */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 glass-strong border-t border-rich-gold/10 px-2 py-2 pb-safe flex justify-around">
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => `flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition relative ${isActive ? 'text-rich-gold' : 'text-soft-gold/50'}`}>
            <div className="relative">
              <i className={`fa-solid ${n.icon} text-lg`}></i>
              {n.to === '/cart' && count > 0 && (
                <span className="absolute -top-2 -right-3 min-w-[16px] h-4 px-1 rounded-full bg-gold-gradient text-black text-[9px] font-bold grid place-items-center">{count > 99 ? '99+' : count}</span>
              )}
            </div>
            <span className="text-[10px] font-medium">{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
