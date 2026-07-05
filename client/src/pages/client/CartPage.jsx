import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { resolveImage } from '../../lib/images'

export default function CartPage() {
  const { items, setQty, remove, subtotal } = useCart()
  const navigate = useNavigate()
  const delivery = items.length ? 5 : 0
  const total = subtotal + delivery

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full glass grid place-items-center text-soft-gold"><i className="fa-solid fa-arrow-left"></i></button>
        <h1 className="heading text-2xl text-white">Your Cart</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-soft-gold/50">
          <i className="fa-solid fa-cart-shopping text-5xl mb-4"></i>
          <p className="mb-4">Your cart is empty</p>
          <button onClick={() => navigate('/shop')} className="btn-gold px-6 py-2.5">Browse Products</button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map(it => (
              <div key={it.productId} className="card p-3 flex items-center gap-3">
                <img src={resolveImage(it.imageUrl)} alt={it.name} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white truncate">{it.name}</div>
                  <div className="text-[11px] text-soft-gold/50 uppercase">{it.category}</div>
                  <div className="text-rich-gold font-bold mt-1">${it.price}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => remove(it.productId)} className="text-soft-gold/40 hover:text-red-400"><i className="fa-solid fa-trash text-sm"></i></button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty(it.productId, it.quantity - 1)} className="w-7 h-7 rounded-lg glass grid place-items-center text-rich-gold"><i className="fa-solid fa-minus text-xs"></i></button>
                    <span className="w-5 text-center text-white text-sm">{it.quantity}</span>
                    <button onClick={() => setQty(it.productId, it.quantity + 1)} className="w-7 h-7 rounded-lg glass grid place-items-center text-rich-gold"><i className="fa-solid fa-plus text-xs"></i></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-4 space-y-2">
            <Row label="Subtotal" value={subtotal} />
            <Row label="Delivery" value={delivery} />
            <div className="h-px bg-rich-gold/10 my-1" />
            <Row label="Total" value={total} bold />
          </div>

          <button onClick={() => navigate('/checkout')} className="btn-gold w-full py-4 text-base">
            Proceed to Checkout <i className="fa-solid fa-arrow-right ml-1"></i>
          </button>
        </>
      )}
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className={`flex justify-between ${bold ? 'text-white font-bold text-lg' : 'text-soft-gold/70 text-sm'}`}>
      <span>{label}</span>
      <span className={bold ? 'gold-text' : ''}>${value.toFixed(2)}</span>
    </div>
  )
}
