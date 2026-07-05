import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { IMG } from '../lib/images'
import Logo from '../components/Logo'

// Cinematic scroll-based landing:
// - Two stacked leaf images: "assembled" (crossfades out) and "explode" (crossfades in)
// - As the user scrolls DOWN the leaf EXPLODES into golden smoke;
//   scrolling UP RE-ASSEMBLES it. Driven by scroll progress (0..1).
export default function Landing() {
  const navigate = useNavigate()
  const wrapRef = useRef(null)
  const assembledRef = useRef(null)
  const explodeRef = useRef(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = wrapRef.current
    function onScroll() {
      const max = el.scrollHeight - el.clientHeight
      const p = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0
      setProgress(p)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Apply cinematic transforms from scroll progress
  useEffect(() => {
    const p = progress
    // assembled: visible at top, fades + scales up as we scroll down
    gsap.to(assembledRef.current, {
      opacity: 1 - Math.min(1, p * 1.6),
      scale: 1 + p * 0.5,
      rotate: p * 12,
      filter: `blur(${p * 6}px)`,
      duration: 0.3, ease: 'power2.out', overwrite: true
    })
    // explode: hidden at top, appears + drifts up as we scroll
    gsap.to(explodeRef.current, {
      opacity: Math.min(1, Math.max(0, (p - 0.15) * 1.8)),
      scale: 1.1 + p * 0.6,
      y: -p * 60,
      duration: 0.3, ease: 'power2.out', overwrite: true
    })
  }, [progress])

  useEffect(() => {
    gsap.fromTo('.land-fade', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', delay: 0.2 })
  }, [])

  return (
    <div ref={wrapRef} className="h-screen overflow-y-auto overflow-x-hidden bg-black relative snap-y snap-mandatory">
      {/* Fixed cinematic background leaf */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img ref={assembledRef} src={IMG.ganjaAssembled} alt=""
          className="absolute inset-0 w-full h-full object-contain will-change-transform" style={{ transformOrigin: '50% 45%' }} />
        <img ref={explodeRef} src={IMG.ganjaExplode} alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-0 will-change-transform" style={{ transformOrigin: '50% 45%' }} />
        {/* vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 40%, transparent 30%, rgba(0,0,0,.6) 100%)' }} />
      </div>

      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-40 bg-white/5">
        <div className="h-full bg-gold-gradient transition-all duration-150" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Top nav */}
      <header className="fixed top-0 left-0 right-0 z-30 px-5 py-4 flex items-center justify-between">
        <Logo size={40} />
        <button onClick={() => navigate('/auth')} className="btn-gold px-5 py-2 text-sm">Enter App</button>
      </header>

      {/* SECTION 1 — Hero (assembled) */}
      <section className="snap-start relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="land-fade">
          <img src={IMG.logo} alt="CALMER" className="w-24 h-24 mx-auto rounded-full ring-2 ring-rich-gold/50 shadow-gold-lg object-cover" />
        </div>
        <h1 className="land-fade font-brand text-6xl sm:text-7xl gold-text mt-6 tracking-[0.12em]">CALMER</h1>
        <div className="land-fade flex items-center justify-center gap-3 mt-3">
          <span className="h-px w-10 bg-soft-gold/40" />
          <p className="heading text-2xl italic text-soft-gold/90">Breathe, Unwind, Elevate</p>
          <span className="h-px w-10 bg-soft-gold/40" />
        </div>
        <p className="land-fade text-soft-gold/50 text-sm mt-6 max-w-sm">
          Premium cannabis wellness, delivered with luxury and care. Scroll to experience CALMER.
        </p>
        <div className="land-fade mt-10 flex flex-col items-center gap-2 text-soft-gold/60 animate-bounce">
          <span className="text-xs tracking-widest uppercase">Scroll to explore</span>
          <i className="fa-solid fa-chevron-down"></i>
        </div>
      </section>

      {/* SECTION 2 — Explode reveal / features */}
      <section className="snap-start relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-center mb-10">
          <h2 className="heading text-4xl sm:text-5xl gold-text">Ignite Your Senses</h2>
          <p className="text-soft-gold/50 text-sm mt-2 max-w-md mx-auto">A curated collection of the finest flower, oils, edibles and more.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full">
          {[
            { icon: 'fa-cannabis', t: 'Premium Flower', s: 'Top-shelf, hand-picked' },
            { icon: 'fa-bottle-droplet', t: 'Pure Oils', s: 'Full-spectrum calm' },
            { icon: 'fa-cookie-bite', t: 'Edibles', s: 'Delicious & precise' },
            { icon: 'fa-truck-fast', t: 'Live Delivery', s: 'Track in real time' }
          ].map(f => (
            <div key={f.t} className="glass-strong rounded-2xl p-5 text-center hover:border-rich-gold/40 transition">
              <div className="w-12 h-12 rounded-full bg-gold-gradient grid place-items-center text-black mx-auto"><i className={`fa-solid ${f.icon}`}></i></div>
              <div className="text-sm font-semibold text-white mt-3">{f.t}</div>
              <div className="text-[11px] text-soft-gold/50 mt-1">{f.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — CTA */}
      <section className="snap-start relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <h2 className="heading text-4xl sm:text-5xl text-white">Your calm is <span className="gold-text">one tap away</span></h2>
        <p className="text-soft-gold/50 text-sm mt-3 max-w-sm">Join CALMER with your secure one-time PASSKEY. No passwords, pure luxury.</p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button onClick={() => navigate('/auth')} className="btn-gold px-8 py-4 text-base"><i className="fa-solid fa-arrow-right-to-bracket mr-2"></i>Get Started</button>
          <button onClick={() => navigate('/auth')} className="btn-ghost px-8 py-4 text-base">I have a Passkey</button>
        </div>
        <div className="mt-16 text-[11px] text-soft-gold/30">
          <div className="font-brand text-lg gold-text">CALMER</div>
          © {new Date().getFullYear()} · Breathe · Unwind · Elevate
        </div>
      </section>
    </div>
  )
}
