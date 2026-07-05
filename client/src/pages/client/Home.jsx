import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import api from '../../lib/api'
import { IMG, resolveImage } from '../../lib/images'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../components/Toast'

const CATEGORIES = [
  { name: 'Flower', icon: 'fa-cannabis', desc: 'Hand picked top shelf' },
  { name: 'Concentrates', icon: 'fa-droplet', desc: 'Pure. Powerful.' },
  { name: 'Edibles', icon: 'fa-cookie-bite', desc: 'Delicious. Effective.' },
  { name: 'Oils', icon: 'fa-bottle-droplet', desc: 'Calm in a drop' }
]

export default function Home() {
  const [products, setProducts] = useState([])
  const navigate = useNavigate()
  const { add } = useCart()
  const toast = useToast()
  const root = useRef(null)

  useEffect(() => {
    api.get('/products').then(({ data }) => setProducts(data.products)).catch(() => {})
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.fade-up', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' })
    }, root)
    return () => ctx.revert()
  }, [products])

  const featured = products.filter(p => p.featured).slice(0, 6)
  const newArrivals = products.filter(p => p.isNewArrival).slice(0, 6)

  return (
    <div ref={root} className="space-y-6">
      {/* Hero */}
      <section className="fade-up relative rounded-3xl overflow-hidden card">
        <img src={IMG.heroHome} alt="" className="w-full h-56 object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute bottom-0 p-5">
          <h1 className="heading text-3xl leading-tight">
            <span className="gold-text">We Deliver</span><br />
            <span className="text-white">Freshness To You</span>
          </h1>
          <button onClick={() => navigate('/shop')} className="btn-gold px-6 py-2.5 mt-3 text-sm">
            Shop Now <i className="fa-solid fa-arrow-right ml-1"></i>
          </button>
        </div>
      </section>

      {/* Trust badges */}
      <section className="fade-up grid grid-cols-3 gap-2">
        {[
          { icon: 'fa-cannabis', t: 'Premium', s: 'Top shelf' },
          { icon: 'fa-shield-halved', t: 'Secure', s: 'Discreet' },
          { icon: 'fa-clock', t: 'On Time', s: 'At your door' }
        ].map(b => (
          <div key={b.t} className="card p-3 text-center">
            <i className={`fa-solid ${b.icon} text-rich-gold text-lg`}></i>
            <div className="text-xs font-semibold text-white mt-1">{b.t}</div>
            <div className="text-[10px] text-soft-gold/50">{b.s}</div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section className="fade-up">
        <SectionTitle title="Shop by Category" />
        <div className="grid grid-cols-2 gap-3 mt-3">
          {CATEGORIES.map(c => (
            <button key={c.name} onClick={() => navigate(`/shop?category=${c.name}`)}
              className="card p-4 text-left hover:border-rich-gold/40 transition group">
              <div className="w-10 h-10 rounded-full bg-gold-gradient/20 border border-rich-gold/30 grid place-items-center mb-2 group-hover:scale-110 transition">
                <i className={`fa-solid ${c.icon} text-rich-gold`}></i>
              </div>
              <div className="text-sm font-semibold text-white">{c.name}</div>
              <div className="text-[11px] text-soft-gold/50">{c.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="fade-up">
          <SectionTitle title="New Arrivals" action="See all" onAction={() => navigate('/shop')} />
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 mt-3 no-scrollbar">
            {newArrivals.map(p => (
              <MiniCard key={p._id} p={p} onOpen={() => navigate(`/product/${p._id}`)}
                onAdd={() => { add(p); toast.success(`${p.name} added to cart`) }} />
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="fade-up">
          <SectionTitle title="Featured" action="See all" onAction={() => navigate('/shop')} />
          <div className="grid grid-cols-2 gap-3 mt-3">
            {featured.map(p => (
              <ProductCard key={p._id} p={p} onOpen={() => navigate(`/product/${p._id}`)}
                onAdd={() => { add(p); toast.success(`${p.name} added to cart`) }} />
            ))}
          </div>
        </section>
      )}

      {/* Deliver bar */}
      <section className="fade-up card p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gold-gradient/20 border border-rich-gold/30 grid place-items-center">
          <i className="fa-solid fa-location-dot text-rich-gold"></i>
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-soft-gold/50 uppercase tracking-wide">Deliver To</div>
          <div className="text-sm font-semibold text-white">Downtown</div>
        </div>
        <button onClick={() => navigate('/shop')} className="btn-gold px-5 py-2 text-sm">Order Now</button>
      </section>
    </div>
  )
}

function SectionTitle({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="heading text-xl text-white">{title}</h2>
      {action && <button onClick={onAction} className="text-xs text-rich-gold">{action} <i className="fa-solid fa-chevron-right text-[10px]"></i></button>}
    </div>
  )
}

function ProductCard({ p, onOpen, onAdd }) {
  return (
    <div className="card overflow-hidden group">
      <button onClick={onOpen} className="block w-full">
        <div className="relative h-32 bg-black/40 overflow-hidden">
          <img src={resolveImage(p.imageUrl)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          {p.isNewArrival && <span className="absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full bg-gold-gradient text-black font-bold">NEW</span>}
        </div>
      </button>
      <div className="p-3">
        <div className="text-sm font-semibold text-white truncate">{p.name}</div>
        <div className="text-[11px] text-soft-gold/50 uppercase">{p.category}</div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-rich-gold font-bold">${p.price}</span>
          <button onClick={onAdd} className="w-8 h-8 rounded-lg bg-gold-gradient text-black grid place-items-center hover:scale-110 transition">
            <i className="fa-solid fa-plus text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  )
}

function MiniCard({ p, onOpen, onAdd }) {
  return (
    <div className="card overflow-hidden w-40 flex-shrink-0">
      <button onClick={onOpen} className="block w-full">
        <img src={resolveImage(p.imageUrl)} alt={p.name} className="w-full h-28 object-cover" />
      </button>
      <div className="p-2.5">
        <div className="text-xs font-semibold text-white truncate">{p.name}</div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-rich-gold text-sm font-bold">${p.price}</span>
          <button onClick={onAdd} className="w-7 h-7 rounded-lg bg-gold-gradient text-black grid place-items-center">
            <i className="fa-solid fa-plus text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  )
}
