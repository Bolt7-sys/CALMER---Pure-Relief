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
    api.get(`/products/${id}`).then(({ data }) => setP(data.product)).catch(() => navigate('/shop'))
  }, [id])

  if (!p) return <div className="py-20 text-center text-soft-gold/50"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div>

  return (
    <div className="space-y-4 pb-4">
      <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full glass grid place-items-center text-soft-gold">
        <i className="fa-solid fa-arrow-left"></i>
      </button>

      <div className="card overflow-hidden">
        <img src={resolveImage(p.imageUrl)} alt={p.name} className="w-full h-64 object-cover" />
      </div>

      <div>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] text-soft-gold/50 uppercase tracking-wide">{p.category}</span>
            <h1 className="heading text-2xl text-white">{p.name}</h1>
          </div>
          <span className="text-2xl font-bold gold-text">${p.price}</span>
        </div>

        <div className="flex gap-2 mt-3">
          {p.thcContent && <span className="chip px-3 py-1 text-xs text-rich-gold">THC {p.thcContent}</span>}
          {p.cbdContent && <span className="chip px-3 py-1 text-xs text-rich-gold">CBD {p.cbdContent}</span>}
          <span className="chip px-3 py-1 text-xs text-emerald-400"><i className="fa-solid fa-check mr-1"></i>{p.stock > 0 ? 'In stock' : 'Sold out'}</span>
        </div>

        <p className="text-sm text-soft-gold/70 leading-relaxed mt-4">{p.description}</p>
      </div>

      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-full glass grid place-items-center text-rich-gold"><i className="fa-solid fa-minus"></i></button>
          <span className="text-lg font-semibold text-white w-6 text-center">{qty}</span>
          <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 rounded-full glass grid place-items-center text-rich-gold"><i className="fa-solid fa-plus"></i></button>
        </div>
        <span className="text-soft-gold/60 text-sm">Total <b className="text-rich-gold">${(p.price * qty).toFixed(2)}</b></span>
      </div>

      <button onClick={() => { add(p, qty); toast.success(`${p.name} added to cart`); navigate('/cart') }}
        className="btn-gold w-full py-4 text-base">
        <i className="fa-solid fa-cart-plus mr-2"></i>Add to Cart
      </button>
    </div>
  )
}
