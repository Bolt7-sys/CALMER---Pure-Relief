import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { IMG } from '../../lib/images'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const menu = [
    { icon: 'fa-box', label: 'My Orders', to: '/orders' },
    { icon: 'fa-bell', label: 'Notifications', to: '/notifications' },
    { icon: 'fa-cart-shopping', label: 'My Cart', to: '/cart' },
    { icon: 'fa-heart', label: 'Favorites', to: '/shop' },
    { icon: 'fa-shield-halved', label: 'Privacy & Security', to: '/profile' },
    { icon: 'fa-circle-question', label: 'Help & Support', to: '/orders' }
  ]

  return (
    <div className="space-y-5">
      <h1 className="heading text-2xl text-white">Account</h1>

      {/* Profile card */}
      <div className="card p-5 relative overflow-hidden">
        <img src={IMG.profile} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gold-gradient grid place-items-center text-black text-2xl font-bold">
            {user?.username?.[1]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="text-lg font-semibold text-white">{user?.fullName || 'CALMER Member'}</div>
            <div className="text-sm text-rich-gold font-mono">{user?.username}</div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-gradient text-black font-bold uppercase mt-1 inline-block">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="card divide-y divide-rich-gold/5">
        {menu.map(m => (
          <button key={m.label} onClick={() => navigate(m.to)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition">
            <div className="w-9 h-9 rounded-full bg-gold-gradient/15 border border-rich-gold/20 grid place-items-center text-rich-gold"><i className={`fa-solid ${m.icon}`}></i></div>
            <span className="flex-1 text-left text-sm text-white">{m.label}</span>
            <i className="fa-solid fa-chevron-right text-soft-gold/30 text-xs"></i>
          </button>
        ))}
      </div>

      <button onClick={() => { logout(); navigate('/auth') }} className="w-full card p-4 flex items-center justify-center gap-2 text-red-400 hover:border-red-400/30 transition">
        <i className="fa-solid fa-arrow-right-from-bracket"></i> Log Out
      </button>

      <div className="text-center text-[10px] text-soft-gold/30 pb-2">
        <div className="font-brand text-lg gold-text">CALMER</div>
        Breathe · Unwind · Elevate · v1.0
      </div>
    </div>
  )
}
