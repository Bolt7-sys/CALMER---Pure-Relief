import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { resolveImage } from '../../lib/images'
import { useToast } from '../../components/Toast'

const CATEGORIES = ['Flower', 'Oils', 'Edibles', 'Vapes', 'Concentrates', 'Accessories']
const IMAGE_OPTIONS = [
  'product-categories.png', 'our-services.png', 'shop-grid.png', 'why-choose.png',
  'how-it-works.png', 'testimonials.png', 'review.png', 'app-showcase.png'
]
const blank = { name: '', category: 'Flower', price: '', thcContent: '', cbdContent: '', stock: '', description: '', imageUrl: '/images/product-categories.png', featured: false, isNewArrival: false }

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [editing, setEditing] = useState(null)
  const toast = useToast()

  function load() { api.get('/products').then(({ data }) => setProducts(data.products)).catch(() => {}) }
  useEffect(load, [])

  async function save(e) {
    e.preventDefault()
    try {
      if (editing._id) { await api.put(`/products/${editing._id}`, editing); toast.success('Product updated') }
      else { await api.post('/products', editing); toast.success('Product added') }
      setEditing(null); load()
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed') }
  }
  async function del(id) {
    if (!confirm('Delete this product?')) return
    try { await api.delete(`/products/${id}`); toast.success('Deleted'); load() } catch { toast.error('Delete failed') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading text-3xl text-white">Products</h1>
          <p className="text-sm text-soft-gold/50">{products.length} items in catalog</p>
        </div>
        <button onClick={() => setEditing({ ...blank })} className="btn-gold px-5 py-2.5 text-sm"><i className="fa-solid fa-plus mr-2"></i>Add Product</button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.map(p => (
          <div key={p._id} className="card overflow-hidden">
            <img src={resolveImage(p.imageUrl)} alt={p.name} className="w-full h-40 object-cover" />
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{p.name}</div>
                  <div className="text-[11px] text-soft-gold/50 uppercase">{p.category}</div>
                </div>
                <span className="gold-text font-bold">${p.price}</span>
              </div>
              <div className="flex gap-2 mt-2 text-[10px] text-soft-gold/50">
                <span>Stock: {p.stock}</span>
                {p.featured && <span className="text-rich-gold">★ Featured</span>}
                {p.isNewArrival && <span className="text-emerald-400">New</span>}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setEditing(p)} className="btn-ghost flex-1 py-2 text-xs"><i className="fa-solid fa-pen mr-1"></i>Edit</button>
                <button onClick={() => del(p._id)} className="btn-ghost py-2 px-3 text-xs text-red-400 border-red-400/20"><i className="fa-solid fa-trash"></i></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <form onSubmit={save} className="relative glass-strong rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="heading text-2xl text-white">{editing._id ? 'Edit' : 'Add'} Product</h2>
              <button type="button" onClick={() => setEditing(null)} className="w-9 h-9 rounded-full glass grid place-items-center text-soft-gold"><i className="fa-solid fa-xmark"></i></button>
            </div>

            <Input label="Name" value={editing.name} onChange={v => setEditing({ ...editing, name: v })} required />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <select value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} className="input-dark w-full px-3 py-2.5 text-sm">
                  {CATEGORIES.map(c => <option key={c} className="bg-rich-black">{c}</option>)}
                </select>
              </div>
              <Input label="Price ($)" type="number" value={editing.price} onChange={v => setEditing({ ...editing, price: v })} required />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="THC" value={editing.thcContent} onChange={v => setEditing({ ...editing, thcContent: v })} />
              <Input label="CBD" value={editing.cbdContent} onChange={v => setEditing({ ...editing, cbdContent: v })} />
              <Input label="Stock" type="number" value={editing.stock} onChange={v => setEditing({ ...editing, stock: v })} />
            </div>
            <div>
              <Label>Description</Label>
              <textarea value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={2} className="input-dark w-full px-3 py-2.5 text-sm rounded-2xl" />
            </div>
            <div>
              <Label>Image</Label>
              <div className="grid grid-cols-4 gap-2">
                {IMAGE_OPTIONS.map(img => (
                  <button type="button" key={img} onClick={() => setEditing({ ...editing, imageUrl: `/images/${img}` })}
                    className={`rounded-lg overflow-hidden ring-2 ${editing.imageUrl === `/images/${img}` ? 'ring-rich-gold' : 'ring-transparent'}`}>
                    <img src={resolveImage(`/images/${img}`)} alt="" className="w-full h-12 object-cover" />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-soft-gold/70"><input type="checkbox" checked={editing.featured} onChange={e => setEditing({ ...editing, featured: e.target.checked })} className="accent-yellow-500" />Featured</label>
              <label className="flex items-center gap-2 text-sm text-soft-gold/70"><input type="checkbox" checked={editing.isNewArrival} onChange={e => setEditing({ ...editing, isNewArrival: e.target.checked })} className="accent-yellow-500" />New Arrival</label>
            </div>
            <button className="btn-gold w-full py-3">{editing._id ? 'Save Changes' : 'Add Product'}</button>
          </form>
        </div>
      )}
    </div>
  )
}

function Label({ children }) { return <div className="text-[11px] text-soft-gold/50 uppercase mb-1">{children}</div> }
function Input({ label, value, onChange, type = 'text', required }) {
  return (
    <div>
      <Label>{label}</Label>
      <input type={type} value={value} required={required} onChange={e => onChange(e.target.value)} className="input-dark w-full px-3 py-2.5 text-sm" />
    </div>
  )
}
