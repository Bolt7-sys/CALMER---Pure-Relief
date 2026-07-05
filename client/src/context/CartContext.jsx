import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)
export const useCart = () => useContext(CartContext)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('calmer_cart') || '[]') } catch { return [] }
  })

  useEffect(() => { localStorage.setItem('calmer_cart', JSON.stringify(items)) }, [items])

  function add(product, qty = 1) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.productId === product._id)
      if (idx >= 0) {
        const next = [...prev]; next[idx] = { ...next[idx], quantity: next[idx].quantity + qty }; return next
      }
      return [...prev, {
        productId: product._id, name: product.name, price: product.price,
        imageUrl: product.imageUrl, category: product.category, quantity: qty
      }]
    })
  }
  function setQty(productId, qty) {
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: Math.max(1, qty) } : i))
  }
  function remove(productId) { setItems(prev => prev.filter(i => i.productId !== productId)) }
  function clear() { setItems([]) }

  const count = items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, count, subtotal }}>
      {children}
    </CartContext.Provider>
  )
}
