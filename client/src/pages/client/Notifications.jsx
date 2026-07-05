import { useEffect, useState } from 'react'
import api from '../../lib/api'

const ICONS = {
  new_order: 'fa-box', order_status: 'fa-truck-fast', chat: 'fa-comment',
  broadcast: 'fa-bullhorn', default: 'fa-bell'
}

export default function Notifications() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/notifications').then(({ data }) => setNotes(data.notifications)).finally(() => setLoading(false))
    api.patch('/notifications/read-all').catch(() => {})
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="heading text-2xl text-white">Notifications</h1>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-20 text-soft-gold/50">
          <i className="fa-solid fa-bell-slash text-5xl mb-3"></i>
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map(n => (
            <div key={n._id} className={`card p-4 flex items-start gap-3 ${!n.read ? 'border-rich-gold/30' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-gold-gradient/20 border border-rich-gold/30 grid place-items-center text-rich-gold flex-shrink-0">
                <i className={`fa-solid ${ICONS[n.type] || ICONS.default}`}></i>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{n.title}</div>
                <div className="text-xs text-soft-gold/60">{n.message}</div>
                <div className="text-[10px] text-soft-gold/40 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-rich-gold mt-2" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
