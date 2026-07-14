import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)
export const useToast = () => useContext(ToastContext)

// Module-level singleton so non-hook code (event handlers, socket callbacks,
// pages that import { toast }) can fire toasts. The provider wires the real
// implementation in on mount; before that, calls are safe no-ops.
export const toast = {
  success: () => {}, error: () => {}, info: () => {}, notify: () => {}
}

// Gentle two-tone chime via WebAudio (no audio file needed). Fails silently
// if the browser blocks audio before a user gesture.
function chime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = chime._ctx || (chime._ctx = new Ctx())
    if (ctx.state === 'suspended') return // autoplay-blocked; skip silently
    const now = ctx.currentTime
    ;[[660, 0], [880, 0.12]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'; osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.06, now + delay + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.3)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + delay); osc.stop(now + delay + 0.32)
    })
  } catch { /* no audio available */ }
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const push = useCallback((message, type = 'info', { sound = false } = {}) => {
    const id = ++idRef.current
    setToasts(t => [...t.slice(-3), { id, message, type }]) // cap stack at 4
    if (sound) chime()
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800)
  }, [])

  const api = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
    notify: (m) => push(m, 'info', { sound: true }) // real-time events get a chime
  }
  // Keep the module singleton pointing at the live implementation
  Object.assign(toast, api)

  const icon = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-bell' }
  const color = { success: 'text-emerald-400', error: 'text-red-400', info: 'text-rich-gold' }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-2 w-[92%] max-w-sm" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className="toast-item glass-strong rounded-2xl px-4 py-3 flex items-center gap-3 shadow-gold">
            <i className={`fa-solid ${icon[t.type]} ${color[t.type]}`}></i>
            <span className="text-sm text-[#EDE7DA]">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
