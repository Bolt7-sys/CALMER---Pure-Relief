import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import { getSocket, onSocket } from '../../lib/socket'
import { useAuth } from '../../context/AuthContext'
import CallOverlay from '../../components/CallOverlay'

export default function Chat() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [order, setOrder] = useState(null)
  const [text, setText] = useState('')
  const [call, setCall] = useState(params.get('call') || null)
  const bottomRef = useRef(null)

  useEffect(() => {
    api.get(`/chat/${id}`).then(({ data }) => { setMessages(data.messages); setOrder(data.order) }).catch(() => navigate('/orders'))
    // onSocket handles the socket-connects-after-mount race
    const off = onSocket((socket) => {
      socket.emit('order:join', id)
      const onMsg = (m) => { if (String(m.orderId) === String(id)) setMessages(prev => prev.some(x => x._id && x._id === m._id) ? prev : [...prev, m]) }
      const onInvite = ({ kind }) => setCall(kind)
      const onEnd = () => setCall(null)
      socket.on('chat:message', onMsg)
      socket.on('call:invite', onInvite)
      socket.on('call:end', onEnd)
      return () => { socket.emit('order:leave', id); socket.off('chat:message', onMsg); socket.off('call:invite', onInvite); socket.off('call:end', onEnd) }
    })
    return () => off?.()
  }, [id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(e) {
    e?.preventDefault()
    if (!text.trim()) return
    const body = text; setText('')
    try { const { data } = await api.post(`/chat/${id}`, { body }); setMessages(prev => prev.some(m => m._id === data.message._id) ? prev : [...prev, data.message]) } catch {}
  }

  function startCall(kind) {
    setCall(kind)
    getSocket()?.emit('call:invite', { orderId: id, kind })
  }
  function endCall() {
    setCall(null)
    getSocket()?.emit('call:end', { orderId: id })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-rich-gold/10">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full glass grid place-items-center text-soft-gold"><i className="fa-solid fa-arrow-left"></i></button>
        <div className="w-10 h-10 rounded-full bg-gold-gradient grid place-items-center text-black"><i className="fa-solid fa-headset"></i></div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">CALMER Support</div>
          <div className="text-[11px] text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1" />Online</div>
        </div>
        <button onClick={() => startCall('voice')} className="w-10 h-10 rounded-full glass grid place-items-center text-rich-gold"><i className="fa-solid fa-phone"></i></button>
        <button onClick={() => startCall('video')} className="w-10 h-10 rounded-full glass grid place-items-center text-rich-gold"><i className="fa-solid fa-video"></i></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 no-scrollbar">
        <div className="text-center text-[11px] text-soft-gold/40">Conversation about {order?.orderNumber}</div>
        {messages.map((m, i) => {
          const mine = m.senderRole === user.role
          if (m.msgType === 'system') return <div key={i} className="text-center text-[11px] text-soft-gold/40">{m.body}</div>
          return (
            <div key={m._id || i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${mine ? 'bg-gold-gradient text-black rounded-br-sm' : 'glass text-[#EDE7DA] rounded-bl-sm'}`}>
                {m.body}
                <div className={`text-[9px] mt-1 ${mine ? 'text-black/50' : 'text-soft-gold/40'}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={send} className="flex items-center gap-2 pt-3 border-t border-rich-gold/10">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..."
          className="flex-1 input-dark px-4 py-3 text-sm outline-none" />
        <button type="submit" className="w-11 h-11 rounded-full bg-gold-gradient text-black grid place-items-center"><i className="fa-solid fa-paper-plane"></i></button>
      </form>

      {call && <CallOverlay kind={call} peer="CALMER Support" onEnd={endCall} />}
    </div>
  )
}
