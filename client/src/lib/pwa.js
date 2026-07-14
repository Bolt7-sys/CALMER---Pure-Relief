// CALMER PWA install manager.
// Handles every real-world edge case:
//   - Android/Chrome/Edge/desktop: captures `beforeinstallprompt` (fires BEFORE React mounts,
//     so we stash it on module load, not inside a component effect).
//   - iOS Safari: no install prompt API exists -> we detect iOS and expose `ios: true`
//     so the UI can show "Share -> Add to Home Screen" instructions.
//   - Already installed: `display-mode: standalone` (or iOS `navigator.standalone`) -> hide button.
//   - `appinstalled` event -> flip state live so the button disappears the moment it's installed.

let deferredPrompt = null
const listeners = new Set()

function notify() { listeners.forEach((fn) => fn(getInstallState())) }

// Capture as early as possible (module scope — runs on first import from main bundle)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()          // stop Chrome's mini-infobar; we show our own gold button
    deferredPrompt = e
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    try { localStorage.setItem('calmer_pwa_installed', '1') } catch { /* private mode */ }
    notify()
  })
}

export function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator.standalone === true // iOS Safari
  )
}

export function isIOS() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const classicIOS = /iPad|iPhone|iPod/.test(ua)
  // iPadOS 13+ masquerades as macOS but has touch
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return classicIOS || iPadOS
}

export function getInstallState() {
  let installed = isStandalone()
  try { installed = installed || localStorage.getItem('calmer_pwa_installed') === '1' } catch { /* ignore */ }
  return {
    installed,
    canPrompt: !!deferredPrompt,
    ios: isIOS()
  }
}

export function subscribeInstall(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Returns: 'accepted' | 'dismissed' | 'unavailable'
export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable'
  const evt = deferredPrompt
  deferredPrompt = null // a prompt event is single-use
  notify()
  try {
    evt.prompt()
    const { outcome } = await evt.userChoice
    if (outcome !== 'accepted') {
      // user dismissed: the browser may fire beforeinstallprompt again later;
      // until then the button falls back to instructions mode.
    }
    return outcome
  } catch {
    return 'unavailable'
  }
}
