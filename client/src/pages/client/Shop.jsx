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
  const [favOnly, setFavOnly] = useState(params.get('fav') === '1')
  const [products, setProducts] = useState([])
  const [favorites, setFavorites] = useState(new Set())
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

  useEffect(() => {
    // Favorites are optional — never block the shop if this call fails
    api.get('/auth/favorites')
      .then(({ data }) => setFavorites(new Set((data.favorites || []).map(String))))
      .catch(() => {})
  }, [])

  async function toggleFav(e, p) {
    e.stopPropagation()
    const id = String(p._id)
    const wasFav = favorites.has(id)
    // Optimistic flip, revert on failure
    setFavorites(prev => { const next = new Set(prev); wasFav ? next.delete(id) : next.add(id); return next })
    try {
      await api.post(`/auth/favorites/${id}`)
    } catch {
      setFavorites(prev => { const next = new Set(prev); wasFav ? next.add(id) : next.delete(id); return next })
      toast.error('Could not update favorites')
    }
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) &&
    (!favOnly || favorites.has(String(p._id)))
  )

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="font-brand text-2xl gold-text">CALMER</h1>
        <p className="text-[10px] tracking-[0.3em] text-soft-gold/60">CANNABIS</p>
      </div>

      {/* Search */}
      <label className="flex items-center gap-3 input-dark px-4 py-3">
        <i className="fa-solid fa-magnifying-glass text-rich-gold/70"></i>
        <input id="search-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search products..."
          className="bg-transparent flex-1 outline-none text-sm placeholder:text-soft-gold/40" />
        <button type="button" onClick={() => setFavOnly(v => !v)} aria-label="Show favorites only" aria-pressed={favOnly}
          className={`transition ${favOnly ? 'text-rich-gold' : 'text-soft-gold/40 hover:text-soft-gold'}`}>
          <i className={`${favOnly ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
        </button>
      </label>

      {/* Category tabs */}
      <nav className="flex gap-2 overflow-x-auto no-scrollbar pb-1" aria-label="Product categories">
        {CATS.map(c => (
          <button key={c.name} onClick={() => setCategory(c.name)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition ${category === c.name ? 'chip-active' : 'chip text-soft-gold/70'}`}>
            <i className={`fa-solid ${c.icon}`}></i>{c.name}
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-52 skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-soft-gold/50">
          <i className={`fa-solid ${favOnly ? 'fa-heart-crack' : 'fa-box-open'} text-4xl mb-3`}></i>
          <p>{favOnly ? 'No favorites yet — tap the heart on a product' : 'No products found'}</p>
          {favOnly && <button onClick={() => setFavOnly(false)} className="btn-ghost px-5 py-2 mt-4 text-sm">Show all products</button>}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(p => {
            const soldOut = (p.stock ?? 0) <= 0
            const isFav = favorites.has(String(p._id))
            return (
              <article key={p._id} className="relative card card-lift overflow-hidden group product-card">
                <button onClick={() => navigate(`/product/${p._id}`)} className="block w-full">
                  <div className="relative h-36 bg-black/40 overflow-hidden">
                    <img src={resolveImage(p.imageUrl)} alt={p.name} loading="lazy"
                      className={`w-full h-full object-cover group-hover:scale-105 transition duration-500 ${soldOut ? 'grayscale opacity-60' : ''}`} />
                    {p.isNewArrival && !soldOut && <span className="absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full bg-gold-gradient text-black font-bold">NEW</span>}
                    {soldOut && <span className="absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full bg-red-500/80 text-white font-bold">SOLD OUT</span>}
                    {p.thcContent && <span className="absolute bottom-2 right-2 text-[9px] px-2 py-0.5 rounded-full glass-strong text-rich-gold">THC {p.thcContent}</span>}
                  </div>
                </button>
                {/* Favorite heart */}
                <button onClick={e => toggleFav(e, p)} aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full glass-strong grid place-items-center transition hover:scale-110">
                  <i className={`${isFav ? 'fa-solid text-red-400' : 'fa-regular text-white/70'} fa-heart text-sm`}></i>
                </button>
                <div className="p-3">
                  <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                  <div className="text-[11px] text-soft-gold/50 uppercase">{p.category}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-rich-gold font-bold">${p.price}</span>
                    <button onClick={() => { if (soldOut) { toast.error('Sold out — check back soon'); return } add(p); toast.success(`${p.name} added`) }}
                      disabled={soldOut} aria-label={`Add ${p.name} to cart`}
                      className={`w-8 h-8 rounded-lg grid place-items-center transition ${soldOut ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-gold-gradient text-black hover:scale-110'}`}>
                      <i className="fa-solid fa-plus text-sm"></i>
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
