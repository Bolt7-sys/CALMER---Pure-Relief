import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import { resolveImage } from '../../lib/images'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../components/Toast'

const CATS = [
  { name: 'All', icon: 'fa-border-all' },
  { name: 'Flower', icon: 'fa-cannabis' },
  { name: 'Oils', icon: 'fa-bottle-droplet' },
  { name: 'Edibles', icon: 'fa-cookie-bite' },
  { name: 'Vapes', icon: 'fa-smoking' },
  { name: 'Concentrates', icon: 'fa-droplet' }
]

export default function Shop() {
  const [params] = useSearchParams()
  const [category, setCategory] = useState(params.get('category') || 'All')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const { add } = useCart()
  const toast = useToast()

  useEffect(() => {
    setLoading(true)
    api.get('/products', { params: category !== 'All' ? { category } : {} })
      .then(({ data }) => setProducts(data.products))
      .finally(() => setLoading(false))
  }, [category])

  const filtered = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="font-brand text-2xl gold-text">CALMER</h1>
        <p className="text-[10px] tracking-[0.3em] text-soft-gold/60">CANNABIS</p>
      </div>

      {/* Search */}
      <label className="flex items-center gap-3 input-dark px-4 py-3">
        <i className="fa-solid fa-magnifying-glass text-rich-gold/70"></i>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products..."
          className="bg-transparent flex-1 outline-none text-sm placeholder:text-soft-gold/40" />
      </label>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATS.map(c => (
          <button key={c.name} onClick={() => setCategory(c.name)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition ${category === c.name ? 'chip-active' : 'chip text-soft-gold/70'}`}>
            <i className={`fa-solid ${c.icon}`}></i>{c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-52 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-soft-gold/50">
          <i className="fa-solid fa-box-open text-4xl mb-3"></i>
          <p>No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(p => (
            <div key={p._id} className="card overflow-hidden group">
              <button onClick={() => navigate(`/product/${p._id}`)} className="block w-full">
                <div className="relative h-36 bg-black/40 overflow-hidden">
                  <img src={resolveImage(p.imageUrl)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  {p.isNewArrival && <span className="absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full bg-gold-gradient text-black font-bold">NEW</span>}
                  {p.thcContent && <span className="absolute bottom-2 right-2 text-[9px] px-2 py-0.5 rounded-full glass-strong text-rich-gold">THC {p.thcContent}</span>}
                </div>
              </button>
              <div className="p-3">
                <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                <div className="text-[11px] text-soft-gold/50 uppercase">{p.category}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-rich-gold font-bold">${p.price}</span>
                  <button onClick={() => { add(p); toast.success(`${p.name} added`) }}
                    className="w-8 h-8 rounded-lg bg-gold-gradient text-black grid place-items-center hover:scale-110 transition">
                    <i className="fa-solid fa-plus text-sm"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
