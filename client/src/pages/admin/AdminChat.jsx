import { useEffect, useRef, useState } from 'react'
import api from '../../lib/api'
import { getSocket, onSocket } from '../../lib/socket'
import { useAuth } from '../../context/AuthContext'
import CallOverlay from '../../components/CallOverlay'
import { useToast } from '../../components/Toast'

export default function AdminChat() {
  const { user } = useAuth()
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [call, setCall] = useState(null)
  const [broadcast, setBroadcast] = useState(false)
  const [bcast, setBcast] = useState({ title: '', message: '' })
  const bottomRef = useRef(null)

  useEffect(() => { api.get('/orders').then(({ data }) => setOrders(data.orders)).catch(() => {}) }, [])

  useEffect(() => {
    if (!selected) return
    api.get(`/chat/${selected._id}`).then(({ data }) => setMessages(data.messages)).catch(() => {})
    // onSocket handles the socket-connects-after-mount race
    const off = onSocket((socket) => {
      socket.emit('order:join', selected._id)
      const onMsg = (m) => { if (String(m.orderId) === String(selected._id)) setMessages(prev => prev.some(x => x._id && x._id === m._id) ? prev : [...prev, m]) }
      socket.on('chat:message', onMsg)
      return () => { socket.emit('order:leave', selected._id); socket.off('chat:message', onMsg) }
    })
    return () => off?.()
  }, [selected])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(e) {
    e?.preventDefault()
    if (!text.trim() || !selected) return
    const body = text; setText('')
    try { const { data } = await api.post(`/chat/${selected._id}`, { body }); setMessages(prev => prev.some(m => m._id === data.message._id) ? prev : [...prev, data.message]) } catch {}
  }

  async function sendBroadcast(e) {
    e.preventDefault()
    try { await api.post('/notifications/broadcast', bcast); toast.success('Broadcast sent to all clients'); setBroadcast(false); setBcast({ title: '', message: '' }) }
    catch { toast.error('Broadcast failed') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading text-3xl text-white">Communications</h1>
          <p className="text-sm text-soft-gold/50">Chat, call, and broadcast to customers.</p>
        </div>
        <button onClick={() => setBroadcast(true)} className="btn-gold px-5 py-2.5 text-sm"><i className="fa-solid fa-bullhorn mr-2"></i>Broadcast</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 h-[70vh]">
        {/* Conversations */}
        <div className="card p-2 overflow-y-auto no-scrollbar">
          <div className="text-[11px] text-soft-gold/50 uppercase px-2 py-2">Conversations</div>
          {orders.map(o => (
            <button key={o._id} onClick={() => setSelected(o)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${selected?._id === o._id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
              <div className="w-10 h-10 rounded-full bg-gold-gradient grid place-items-center text-black font-bold">{o.clientUsername?.[1]?.toUpperCase()}</div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm text-white truncate">{o.clientUsername}</div>
                <div className="text-[11px] text-soft-gold/50 font-mono truncate">{o.orderNumber}</div>
              </div>
            </button>
          ))}
          {orders.length === 0 && <div className="p-6 text-center text-soft-gold/40 text-sm">No conversations</div>}
        </div>

        {/* Chat window */}
        <div className="lg:col-span-2 card flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 grid place-items-center text-soft-gold/40">
              <div className="text-center"><i className="fa-solid fa-comments text-5xl mb-3"></i><p>Select a conversation</p></div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-rich-gold/10">
                <div className="w-10 h-10 rounded-full bg-gold-gradient grid place-items-center text-black font-bold">{selected.clientUsername?.[1]?.toUpperCase()}</div>
                <div className="flex-1"><div className="text-sm text-white">{selected.clientUsername}</div><div className="text-[11px] text-soft-gold/50 font-mono">{selected.orderNumber}</div></div>
                <button onClick={() => { setCall('voice'); getSocket()?.emit('call:invite', { orderId: selected._id, kind: 'voice' }) }} className="w-9 h-9 rounded-full glass grid place-items-center text-rich-gold"><i className="fa-solid fa-phone"></i></button>
                <button onClick={() => { setCall('video'); getSocket()?.emit('call:invite', { orderId: selected._id, kind: 'video' }) }} className="w-9 h-9 rounded-full glass grid place-items-center text-rich-gold"><i className="fa-solid fa-video"></i></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {messages.map((m, i) => {
                  const mine = m.senderRole === user.role
                  if (m.msgType === 'system') return <div key={i} className="text-center text-[11px] text-soft-gold/40">{m.body}</div>
                  return (
                    <div key={m._id || i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${mine ? 'bg-gold-gradient text-black rounded-br-sm' : 'glass text-[#EDE7DA] rounded-bl-sm'}`}>
                        {m.body}<div className={`text-[9px] mt-1 ${mine ? 'text-black/50' : 'text-soft-gold/40'}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-rich-gold/10">
                <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a reply..." className="flex-1 input-dark px-4 py-3 text-sm outline-none" />
                <button type="submit" className="w-11 h-11 rounded-full bg-gold-gradient text-black grid place-items-center"><i className="fa-solid fa-paper-plane"></i></button>
              </form>
            </>
          )}
        </div>
      </div>

      {call && selected && <CallOverlay kind={call} peer={selected.clientUsername} onEnd={() => { setCall(null); getSocket()?.emit('call:end', { orderId: selected._id }) }} />}

      {broadcast && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" onClick={() => setBroadcast(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <form onSubmit={sendBroadcast} className="relative glass-strong rounded-3xl p-6 w-full max-w-md space-y-3" onClick={e => e.stopPropagation()}>
            <h2 className="heading text-2xl text-white">Broadcast to All Clients</h2>
            <input value={bcast.title} onChange={e => setBcast({ ...bcast, title: e.target.value })} placeholder="Title" required className="input-dark w-full px-4 py-3 text-sm" />
            <textarea value={bcast.message} onChange={e => setBcast({ ...bcast, message: e.target.value })} placeholder="Message" required rows={3} className="input-dark w-full px-4 py-3 text-sm rounded-2xl" />
            <button className="btn-gold w-full py-3"><i className="fa-solid fa-paper-plane mr-2"></i>Send Broadcast</button>
          </form>
        </div>
      )}
    </div>
  )
}
