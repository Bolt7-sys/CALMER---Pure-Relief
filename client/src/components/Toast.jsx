import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800)
  }, [])

  const toast = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info')
  }

  const icon = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-bell' }
  const color = { success: 'text-emerald-400', error: 'text-red-400', info: 'text-rich-gold' }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-2 w-[92%] max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className="glass-strong rounded-2xl px-4 py-3 flex items-center gap-3 shadow-gold animate-[float_.4s_ease]">
            <i className={`fa-solid ${icon[t.type]} ${color[t.type]}`}></i>
            <span className="text-sm text-[#EDE7DA]">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
