import { useEffect, useState } from 'react'
import { IMG } from '../lib/images'

// Built-in call UI (voice/video). Uses timer; signaling relayed via socket.
export default function CallOverlay({ kind = 'voice', peer = 'CALMER', onEnd }) {
  const [seconds, setSeconds] = useState(0)
  const [muted, setMuted] = useState(false)
  const [connecting, setConnecting] = useState(true)

  useEffect(() => {
    const c = setTimeout(() => setConnecting(false), 1600)
    const t = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => { clearTimeout(c); clearInterval(t) }
  }, [])

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <div className="fixed inset-0 z-[500] flex flex-col items-center justify-between py-16"
      style={{ background: 'radial-gradient(circle at 50% 30%, #1a1710, #060504 80%)' }}>
      {kind === 'video' && <img src={IMG.tracking} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
      <div className="relative text-center">
        <div className="text-xs text-soft-gold/50 uppercase tracking-widest">{kind} call</div>
        <div className="w-28 h-28 rounded-full bg-gold-gradient grid place-items-center mx-auto mt-6 shadow-gold-lg animate-float">
          <i className={`fa-solid ${kind === 'video' ? 'fa-video' : 'fa-headset'} text-black text-4xl`}></i>
        </div>
        <h2 className="heading text-3xl text-white mt-5">{peer}</h2>
        <p className="text-rich-gold text-sm mt-1">{connecting ? 'Connecting…' : `${mm}:${ss}`}</p>
      </div>

      <div className="relative flex items-center gap-5">
        <button onClick={() => setMuted(m => !m)} className={`w-14 h-14 rounded-full grid place-items-center ${muted ? 'bg-white/20 text-white' : 'glass text-rich-gold'}`}>
          <i className={`fa-solid ${muted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
        </button>
        <button onClick={onEnd} className="w-18 h-18 w-16 h-16 rounded-full bg-red-500 grid place-items-center text-white text-2xl shadow-lg hover:scale-105 transition">
          <i className="fa-solid fa-phone-slash"></i>
        </button>
        <button className="w-14 h-14 rounded-full glass grid place-items-center text-rich-gold">
          <i className="fa-solid fa-volume-high"></i>
        </button>
      </div>
    </div>
  )
}
