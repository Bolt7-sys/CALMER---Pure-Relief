import { useEffect, useState } from 'react'

// Live connectivity banner — shows instantly when the network drops and
// confirms with a brief green flash when it returns.
export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine)
  const [justBack, setJustBack] = useState(false)

  useEffect(() => {
    const goOffline = () => { setOnline(false); setJustBack(false) }
    const goOnline = () => {
      setOnline(true); setJustBack(true)
      const t = setTimeout(() => setJustBack(false), 2500)
      return () => clearTimeout(t)
    }
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (online && !justBack) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-[700] text-center text-xs font-semibold py-2 px-4 transition-colors ${
      online ? 'bg-emerald-500/90 text-black' : 'bg-amber-500/95 text-black'
    }`} role="status" aria-live="polite">
      {online
        ? <><i className="fa-solid fa-wifi mr-1.5"></i>Back online — everything is live again</>
        : <><i className="fa-solid fa-plane mr-1.5"></i>You're offline — showing cached CALMER. Live tracking paused.</>}
    </div>
  )
}
