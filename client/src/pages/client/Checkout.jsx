import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../components/Toast'

export default function Checkout() {
  const { items, subtotal, clear } = useCart()
  const navigate = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState(1) // 1 address, 2 payment
  const [busy, setBusy] = useState(false)
  const [pinned, setPinned] = useState(null)
  const [addr, setAddr] = useState({ street: '', city: '', postalCode: '', notes: '' })
  const [phone, setPhone] = useState('')
  const [method, setMethod] = useState('card')

  const delivery = items.length ? 5 : 0
  const total = subtotal + delivery

  if (items.length === 0) { navigate('/shop'); return null }

  function pinLocation() {
    if (!navigator.geolocation) {
      // fallback demo coordinates
      setPinned({ latitude: 25.2048, longitude: 55.2708 })
      toast.info('Pinned approximate location')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPinned({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); toast.success('Location pinned!') },
      () => { setPinned({ latitude: 25.2048, longitude: 55.2708 }); toast.info('Used approximate location') }
    )
  }

  async function placeOrder() {
    setBusy(true)
    try {
      const { data } = await api.post('/orders', {
        items, paymentMethod: method, clientPhone: phone,
        deliveryAddress: addr, liveLocation: pinned
      })
      clear()
      navigate(`/order/${data.order._id}/confirmed`, { state: { order: data.order } })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Checkout failed')
    } finally { setBusy(false) }
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="w-10 h-10 rounded-full glass grid place-items-center text-soft-gold"><i className="fa-solid fa-arrow-left"></i></button>
        <h1 className="heading text-2xl text-white">Checkout</h1>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {['Delivery', 'Payment'].map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold ${step >= i + 1 ? 'bg-gold-gradient text-black' : 'glass text-soft-gold/50'}`}>{i + 1}</div>
            <span className={`text-xs ${step >= i + 1 ? 'text-rich-gold' : 'text-soft-gold/40'}`}>{s}</span>
            {i === 0 && <div className="flex-1 h-px bg-rich-gold/15" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <Field icon="fa-road" placeholder="Street address" value={addr.street} onChange={e => setAddr({ ...addr, street: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Field icon="fa-city" placeholder="City" value={addr.city} onChange={e => setAddr({ ...addr, city: e.target.value })} />
            <Field icon="fa-hashtag" placeholder="Postal code" value={addr.postalCode} onChange={e => setAddr({ ...addr, postalCode: e.target.value })} />
          </div>
          <Field icon="fa-phone" placeholder="Contact phone" value={phone} onChange={e => setPhone(e.target.value)} />
          <Field icon="fa-note-sticky" placeholder="Delivery notes (optional)" value={addr.notes} onChange={e => setAddr({ ...addr, notes: e.target.value })} />

          <button onClick={pinLocation} className={`w-full card p-4 flex items-center gap-3 transition ${pinned ? 'border-emerald-400/40' : 'hover:border-rich-gold/40'}`}>
            <div className={`w-10 h-10 rounded-full grid place-items-center ${pinned ? 'bg-emerald-400/20 text-emerald-400' : 'bg-gold-gradient/20 text-rich-gold border border-rich-gold/30'}`}>
              <i className={`fa-solid ${pinned ? 'fa-location-dot' : 'fa-map-location-dot'}`}></i>
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-semibold text-white">{pinned ? 'Location pinned' : 'Pin my live location'}</div>
              <div className="text-[11px] text-soft-gold/50">{pinned ? `${pinned.latitude.toFixed(4)}, ${pinned.longitude.toFixed(4)}` : 'For accurate live delivery tracking'}</div>
            </div>
            {pinned && <i className="fa-solid fa-circle-check text-emerald-400"></i>}
          </button>

          <button disabled={!addr.street || !addr.city} onClick={() => setStep(2)}
            className="btn-gold w-full py-4 disabled:opacity-40 disabled:cursor-not-allowed">Continue to Payment</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h3 className="text-sm text-soft-gold/60 uppercase tracking-wide">Payment Method</h3>
          {[
            { id: 'card', icon: 'fa-credit-card', label: 'Credit / Debit Card' },
            { id: 'wallet', icon: 'fa-wallet', label: 'Digital Wallet' },
            { id: 'cash', icon: 'fa-money-bill', label: 'Cash on Delivery' }
          ].map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)}
              className={`w-full card p-4 flex items-center gap-3 transition ${method === m.id ? 'border-rich-gold/50 shadow-gold' : 'hover:border-rich-gold/30'}`}>
              <i className={`fa-solid ${m.icon} text-rich-gold w-5`}></i>
              <span className="flex-1 text-left text-sm text-white">{m.label}</span>
              <div className={`w-5 h-5 rounded-full border-2 ${method === m.id ? 'border-rich-gold bg-gold-gradient' : 'border-soft-gold/30'}`} />
            </button>
          ))}

          <div className="card p-4 space-y-2 mt-4">
            <Row label="Subtotal" value={subtotal} />
            <Row label="Delivery" value={delivery} />
            <div className="h-px bg-rich-gold/10 my-1" />
            <Row label="Total" value={total} bold />
          </div>

          <button disabled={busy} onClick={placeOrder} className="btn-gold w-full py-4 text-base">
            {busy ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-lock mr-2"></i>}
            Pay ${total.toFixed(2)}
          </button>
        </div>
      )}
    </div>
  )
}

function Field({ icon, ...props }) {
  return (
    <label className="flex items-center gap-3 input-dark px-4 py-3">
      <i className={`fa-solid ${icon} text-rich-gold/70 w-4`}></i>
      <input {...props} className="bg-transparent flex-1 outline-none text-sm placeholder:text-soft-gold/40" />
    </label>
  )
}
function Row({ label, value, bold }) {
  return (
    <div className={`flex justify-between ${bold ? 'text-white font-bold text-lg' : 'text-soft-gold/70 text-sm'}`}>
      <span>{label}</span><span className={bold ? 'gold-text' : ''}>${value.toFixed(2)}</span>
    </div>
  )
}
