import { useEffect, useState } from 'react'
import { getInstallState, subscribeInstall, promptInstall } from '../lib/pwa'
import { useToast } from './Toast'

// ============================================================================
// InstallAppButton — the clean, clearly-visible "Install CALMER App" button.
// Shown to BOTH clients and admins. Works everywhere:
//   * Chrome / Edge / Android  -> native install prompt
//   * iOS Safari               -> step-by-step "Add to Home Screen" guide
//   * Other browsers           -> friendly instructions modal
//   * Already installed        -> button hides itself automatically
// ============================================================================
export function InstallAppButton({ variant = 'full', className = '' }) {
  const [state, setState] = useState(getInstallState)
  const [showGuide, setShowGuide] = useState(false)
  const toast = useToast()

  useEffect(() => subscribeInstall(setState), [])

  if (state.installed) return null // already living on the phone — stay out of the way

  async function handleClick() {
    if (state.canPrompt) {
      const outcome = await promptInstall()
      if (outcome === 'accepted') toast.success('CALMER is installing on your device! 🌿')
      else if (outcome === 'dismissed') toast.info('You can install CALMER anytime from here.')
      else setShowGuide(true)
    } else {
      setShowGuide(true) // iOS / unsupported browsers -> visual guide
    }
  }

  return (
    <>
      {variant === 'full' ? (
        <button onClick={handleClick} id="install-calmer-btn" aria-label="Install CALMER app on your phone"
          className={`install-btn relative overflow-hidden w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-semibold text-base ${className}`}>
          <span className="relative z-10 w-10 h-10 rounded-xl bg-black/20 grid place-items-center">
            <i className="fa-solid fa-mobile-screen-button text-lg"></i>
          </span>
          <span className="relative z-10 text-left leading-tight">
            <span className="block">Install CALMER App</span>
            <span className="block text-[11px] font-normal opacity-70">In your phone — fast, offline-ready</span>
          </span>
          <i className="fa-solid fa-circle-down relative z-10 ml-1"></i>
        </button>
      ) : variant === 'compact' ? (
        <button onClick={handleClick} aria-label="Install CALMER app on your phone"
          className={`install-btn px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold ${className}`}>
          <i className="fa-solid fa-mobile-screen-button"></i>
          <span>Install App</span>
        </button>
      ) : (
        // 'menu' — row style for profile menus / sidebars
        <button onClick={handleClick} aria-label="Install CALMER app on your phone"
          className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition ${className}`}>
          <span className="w-9 h-9 rounded-full bg-gold-gradient grid place-items-center text-black">
            <i className="fa-solid fa-mobile-screen-button"></i>
          </span>
          <span className="flex-1 text-left">
            <span className="block text-sm text-white font-semibold">Install CALMER App</span>
            <span className="block text-[10px] text-soft-gold/50">Add to your phone's home screen</span>
          </span>
          <i className="fa-solid fa-circle-down text-rich-gold"></i>
        </button>
      )}

      {showGuide && <InstallGuide ios={state.ios} onClose={() => setShowGuide(false)} />}
    </>
  )
}

// Step-by-step visual guide (iOS Safari has no install API — must be manual)
function InstallGuide({ ios, onClose }) {
  const steps = ios
    ? [
        { icon: 'fa-arrow-up-from-bracket', text: <>Tap the <b className="text-rich-gold">Share</b> button in Safari's toolbar</> },
        { icon: 'fa-square-plus', text: <>Scroll and tap <b className="text-rich-gold">Add to Home Screen</b></> },
        { icon: 'fa-circle-check', text: <>Tap <b className="text-rich-gold">Add</b> — CALMER appears on your home screen</> }
      ]
    : [
        { icon: 'fa-ellipsis-vertical', text: <>Open your browser's <b className="text-rich-gold">menu</b> (⋮ or ⋯)</> },
        { icon: 'fa-circle-down', text: <>Choose <b className="text-rich-gold">Install app</b> / <b className="text-rich-gold">Add to Home screen</b></> },
        { icon: 'fa-circle-check', text: <>Confirm — CALMER installs like a native app</> }
      ]

  return (
    <div className="fixed inset-0 z-[600] grid place-items-center p-5" onClick={onClose} role="dialog" aria-modal="true" aria-label="How to install CALMER">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative glass-strong rounded-3xl p-6 w-full max-w-sm shadow-gold-lg" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gold-gradient grid place-items-center shadow-gold-lg mb-3">
            <i className="fa-solid fa-mobile-screen-button text-black text-2xl"></i>
          </div>
          <h2 className="heading text-2xl text-white">Install CALMER</h2>
          <p className="text-xs text-soft-gold/60 mt-1">
            {ios ? 'On iPhone / iPad (Safari)' : 'Get the full app experience on your phone'}
          </p>
        </div>

        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="card p-3.5 flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-gold-gradient/20 border border-rich-gold/30 grid place-items-center text-rich-gold flex-shrink-0">
                <i className={`fa-solid ${s.icon}`}></i>
              </span>
              <span className="text-sm text-[#EDE7DA] leading-snug">
                <span className="text-[10px] text-soft-gold/50 block uppercase tracking-wide">Step {i + 1}</span>
                {s.text}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-4 card p-3 text-[11px] text-soft-gold/60 flex items-start gap-2">
          <i className="fa-solid fa-wand-magic-sparkles text-rich-gold mt-0.5"></i>
          <span>Once installed, CALMER opens full-screen, loads instantly, and works even with a shaky connection.</span>
        </div>

        <button onClick={onClose} className="btn-gold w-full py-3 mt-4">Got it</button>
      </div>
    </div>
  )
}

export default InstallAppButton
