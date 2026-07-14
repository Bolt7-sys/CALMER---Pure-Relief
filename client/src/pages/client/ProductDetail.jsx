import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { resolveImage } from '../../lib/images'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../components/Toast'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { add } = useCart()
  const toast = useToast()
  const [p, setP] = useState(null)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    let alive = true
    api.get(`/products/${id}`).then(({ data }) => { if (alive) setP(data.product) }).catch(() => navigate('/shop'))
    return () => { alive = false }
  }, [id])

  if (!p) return <div className="py-20 text-center text-soft-gold/50"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div>

  const stock = p.stock ?? 0
  const soldOut = stock <= 0
  const lowStock = !soldOut && stock <= 5
  // Never let qty exceed available stock (server enforces too, but don't set users up to fail)
  const maxQty = Math.max(1, Math.min(stock, 50))

  function addToCart() {
    if (soldOut) { toast.error('This product is sold out'); return }
    add(p, Math.min(qty, maxQty))
    toast.success(`${p.name} added to cart`)
    navigate('/cart')
  }

  return (
    <div className="space-y-4 pb-4">
      <button onClick={() => navigate(-1)} aria-label="Go back" className="w-10 h-10 rounded-full glass grid place-items-center text-soft-gold">
        <i className="fa-solid fa-arrow-left"></i>
      </button>

      <div className="card overflow-hidden relative">
        <img src={resolveImage(p.imageUrl)} alt={p.name} className={`w-full h-64 object-cover ${soldOut ? 'grayscale opacity-60' : ''}`} />
        {soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-black/40">
            <span className="px-4 py-1.5 rounded-full bg-red-500/90 text-white text-sm font-bold">SOLD OUT</span>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] text-soft-gold/50 uppercase tracking-wide">{p.category}</span>
            <h1 className="heading text-2xl text-white">{p.name}</h1>
          </div>
          <span className="text-2xl font-bold gold-text">${p.price}</span>
        </div>

        <div className="flex gap-2 mt-3 flex-wrap">
          {p.thcContent && <span className="chip px-3 py-1 text-xs text-rich-gold">THC {p.thcContent}</span>}
          {p.cbdContent && <span className="chip px-3 py-1 text-xs text-rich-gold">CBD {p.cbdContent}</span>}
          {soldOut ? (
            <span className="chip px-3 py-1 text-xs text-red-400"><i className="fa-solid fa-ban mr-1"></i>Sold out</span>
          ) : lowStock ? (
            <span className="chip px-3 py-1 text-xs text-amber-400"><i className="fa-solid fa-fire mr-1"></i>Only {stock} left</span>
          ) : (
            <span className="chip px-3 py-1 text-xs text-emerald-400"><i className="fa-solid fa-check mr-1"></i>In stock</span>
          )}
        </div>

        <p className="text-sm text-soft-gold/70 leading-relaxed mt-4">{p.description}</p>
      </div>

      {!soldOut && (
        <div className="card p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease quantity" className="w-9 h-9 rounded-full glass grid place-items-center text-rich-gold"><i className="fa-solid fa-minus"></i></button>
            <span className="text-lg font-semibold text-white w-6 text-center" aria-live="polite">{qty}</span>
            <button onClick={() => setQty(q => Math.min(maxQty, q + 1))} aria-label="Increase quantity" className="w-9 h-9 rounded-full glass grid place-items-center text-rich-gold disabled:opacity-40" disabled={qty >= maxQty}><i className="fa-solid fa-plus"></i></button>
          </div>
          <span className="text-soft-gold/60 text-sm">Total <b className="text-rich-gold">${(p.price * qty).toFixed(2)}</b></span>
        </div>
      )}

      <button onClick={addToCart} disabled={soldOut}
        className={`w-full py-4 text-base rounded-2xl font-semibold transition ${soldOut ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'btn-gold'}`}>
        <i className={`fa-solid ${soldOut ? 'fa-ban' : 'fa-cart-plus'} mr-2`}></i>{soldOut ? 'Sold Out' : 'Add to Cart'}
      </button>
    </div>
  )
}
