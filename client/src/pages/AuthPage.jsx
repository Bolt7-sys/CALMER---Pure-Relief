import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { IMG } from '../lib/images'

export default function AuthPage() {
  const { login, register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login')      // login | register
  const [role, setRole] = useState('client')     // client | admin
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ username: '', passkey: '', fullName: '', email: '', phone: '' })
  const [revealed, setRevealed] = useState(null)  // one-time passkey after register

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      if (mode === 'login') {
        const data = await login(form.username, form.passkey)
        toast.success(`Welcome back, ${data.user.username}`)
        navigate(data.user.role === 'admin' ? '/admin' : '/')
      } else {
        const data = await register({ ...form, role })
        setRevealed({ passkey: data.passkey, user: data.user })
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  function proceedAfterReveal() {
    toast.success('Account ready. Save your passkey!')
    navigate(revealed.user.role === 'admin' ? '/admin' : '/')
  }

  const placeholderUser = role === 'admin' ? '@admin-yourname' : '@yourname'

  return (
    <div className="min-h-screen relative flex items-center justify-center p-5 overflow-hidden">
      {/* Background image */}
      <img src={IMG.loginBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/90" />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <img src={IMG.logo} alt="CALMER" className="w-20 h-20 mx-auto rounded-full ring-2 ring-rich-gold/50 shadow-gold-lg object-cover" />
          <h1 className="font-brand text-5xl gold-text mt-4">CALMER</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="h-px w-8 bg-soft-gold/40" />
            <p className="text-soft-gold/80 heading text-lg italic">Breathe, Unwind, Elevate</p>
            <span className="h-px w-8 bg-soft-gold/40" />
          </div>
        </div>

        {revealed ? (
          <PasskeyReveal revealed={revealed} onProceed={proceedAfterReveal} />
        ) : (
          <div className="glass-strong rounded-3xl p-6 shadow-gold-lg">
            {/* Mode tabs */}
            <div className="flex bg-black/40 rounded-full p-1 mb-5">
              {['login', 'register'].map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-full text-sm font-medium capitalize transition ${mode === m ? 'bg-gold-gradient text-black' : 'text-soft-gold/70'}`}>
                  {m === 'login' ? 'Log In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* Role toggle */}
            <div className="flex gap-2 mb-5">
              {['client', 'admin'].map(r => (
                <button key={r} onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase border transition ${role === r ? 'chip-active' : 'chip text-soft-gold/70'}`}>
                  <i className={`fa-solid ${r === 'admin' ? 'fa-user-shield' : 'fa-user'} mr-2`}></i>{r}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-3">
              <Field icon="fa-at" placeholder={placeholderUser} value={form.username} onChange={set('username')} />

              {mode === 'register' && (
                <>
                  <Field icon="fa-signature" placeholder="Full name" value={form.fullName} onChange={set('fullName')} />
                  <Field icon="fa-envelope" placeholder="Email" value={form.email} onChange={set('email')} />
                  <Field icon="fa-phone" placeholder="Phone" value={form.phone} onChange={set('phone')} />
                  <div className="text-[11px] text-soft-gold/60 px-2 flex items-start gap-2">
                    <i className="fa-solid fa-key mt-0.5"></i>
                    <span>A one-time <b className="text-rich-gold">CALMER PASSKEY</b> will be generated for you. Save it — it replaces a password and is shown only once.</span>
                  </div>
                </>
              )}

              {mode === 'login' && (
                <Field icon="fa-key" placeholder="CALMER-XXXX-XXXX-XXXX" value={form.passkey} onChange={set('passkey')} mono />
              )}

              <button disabled={busy} className="btn-gold w-full py-3.5 text-base mt-2 flex items-center justify-center gap-2">
                {busy ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className={`fa-solid ${mode === 'login' ? 'fa-arrow-right-to-bracket' : 'fa-user-plus'}`}></i>}
                {mode === 'login' ? 'Enter CALMER' : 'Create Account'}
              </button>
            </form>

            {mode === 'login' && (
              <div className="mt-4 text-center text-[11px] text-soft-gold/50 leading-relaxed">
                Demo Client: <span className="text-rich-gold">@wellness</span> / CALMER-USER-CALM-GOLD<br />
                Demo Admin: <span className="text-rich-gold">@admin-calmer</span> / CALMER-ADMIN-ADMN-CALM-GOLD
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ icon, mono, ...props }) {
  return (
    <label className="flex items-center gap-3 input-dark px-4 py-3">
      <i className={`fa-solid ${icon} text-rich-gold/70 w-4`}></i>
      <input {...props}
        className={`bg-transparent flex-1 outline-none text-sm placeholder:text-soft-gold/40 ${mono ? 'font-mono tracking-wider uppercase' : ''}`} />
    </label>
  )
}

function PasskeyReveal({ revealed, onProceed }) {
  const { passkey, user } = revealed
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard?.writeText(passkey)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="glass-strong rounded-3xl p-6 shadow-gold-lg text-center">
      <div className="w-14 h-14 mx-auto rounded-full bg-gold-gradient grid place-items-center mb-3">
        <i className="fa-solid fa-key text-black text-xl"></i>
      </div>
      <h2 className="heading text-2xl text-rich-gold">Your CALMER Passkey</h2>
      <p className="text-xs text-soft-gold/60 mt-1 mb-4">Account <b className="text-rich-gold">{user.username}</b> created. Save this now — it won't be shown again.</p>
      <button onClick={copy} className="w-full card p-4 font-mono text-lg tracking-widest text-rich-gold hover:border-rich-gold/40 transition">
        {passkey}
        <div className="text-[10px] text-soft-gold/50 mt-2 font-sans tracking-normal">
          <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'} mr-1`}></i>{copied ? 'Copied!' : 'Tap to copy'}
        </div>
      </button>
      <button onClick={onProceed} className="btn-gold w-full py-3.5 mt-5">I've saved it — Continue</button>
    </div>
  )
}
