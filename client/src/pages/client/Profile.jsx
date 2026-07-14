import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { IMG } from '../../lib/images'
import { InstallAppButton } from '../../components/InstallApp'
import { toast } from '../../components/Toast'

export default function Profile() {
  const { user, logout, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [saving, setSaving] = useState(false)

  const menu = [
    { icon: 'fa-box', label: 'My Orders', to: '/orders' },
    { icon: 'fa-bell', label: 'Notifications', to: '/notifications' },
    { icon: 'fa-cart-shopping', label: 'My Cart', to: '/cart' },
    { icon: 'fa-heart', label: 'Favorites', to: '/shop?fav=1' },
    { icon: 'fa-circle-question', label: 'Help & Support', to: '/orders' }
  ]

  async function saveProfile() {
    if (saving) return
    const name = fullName.trim()
    if (!name) { toast.error('Name cannot be empty'); return }
    setSaving(true)
    try {
      await updateProfile({ fullName: name, phone: phone.trim() })
      toast.success('Profile updated')
      setEditing(false)
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="heading text-2xl text-white">Account</h1>

      {/* Profile card */}
      <section id="profile-card" className="card p-5 relative overflow-hidden">
        <img src={IMG.profile} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gold-gradient grid place-items-center text-black text-2xl font-bold shrink-0">
            {(user?.fullName?.[0] || user?.username?.[1] || 'U').toUpperCase()}
          </div>
          {editing ? (
            <div className="flex-1 space-y-2">
              <input value={fullName} onChange={e => setFullName(e.target.value)} maxLength={60}
                placeholder="Full name" aria-label="Full name"
                className="w-full bg-black/40 border border-rich-gold/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rich-gold" />
              <input value={phone} onChange={e => setPhone(e.target.value)} maxLength={20}
                placeholder="Phone (optional)" aria-label="Phone number" inputMode="tel"
                className="w-full bg-black/40 border border-rich-gold/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rich-gold" />
              <div className="flex gap-2">
                <button onClick={saveProfile} disabled={saving} className="btn-gold px-4 py-1.5 text-xs disabled:opacity-50">
                  {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Save'}
                </button>
                <button onClick={() => { setEditing(false); setFullName(user?.fullName || ''); setPhone(user?.phone || '') }} className="btn-ghost px-4 py-1.5 text-xs">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-semibold text-white truncate">{user?.fullName || 'CALMER Member'}</div>
                <div className="text-sm text-rich-gold font-mono truncate">{user?.username}</div>
                {user?.phone && <div className="text-[11px] text-soft-gold/60">{user.phone}</div>}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-gradient text-black font-bold uppercase mt-1 inline-block">{user?.role}</span>
              </div>
              <button onClick={() => setEditing(true)} aria-label="Edit profile"
                className="w-9 h-9 rounded-full glass grid place-items-center text-rich-gold hover:bg-white/10 transition shrink-0">
                <i className="fa-solid fa-pen text-xs"></i>
              </button>
            </>
          )}
        </div>
      </section>

      {/* Install CALMER App — clear visible entry in the account menu too */}
      <InstallAppButton variant="menu" />

      {/* Menu */}
      <nav id="account-menu" className="card divide-y divide-rich-gold/5">
        {menu.map(m => (
          <button key={m.label} onClick={() => navigate(m.to)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition">
            <div className="w-9 h-9 rounded-full bg-gold-gradient/15 border border-rich-gold/20 grid place-items-center text-rich-gold"><i className={`fa-solid ${m.icon}`}></i></div>
            <span className="flex-1 text-left text-sm text-white">{m.label}</span>
            <i className="fa-solid fa-chevron-right text-soft-gold/30 text-xs"></i>
          </button>
        ))}
      </nav>

      <button onClick={() => { logout(); navigate('/auth') }} className="w-full card p-4 flex items-center justify-center gap-2 text-red-400 hover:border-red-400/30 transition">
        <i className="fa-solid fa-arrow-right-from-bracket"></i> Log Out
      </button>

      <div className="text-center text-[10px] text-soft-gold/30 pb-2">
        <div className="font-brand text-lg gold-text">CALMER</div>
        Breathe · Unwind · Elevate · v2.0
      </div>
    </div>
  )
}
