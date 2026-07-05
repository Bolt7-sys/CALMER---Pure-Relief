import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import api from '../../lib/api'

export default function OrderConfirmed() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [order, setOrder] = useState(location.state?.order || null)

  useEffect(() => {
    if (!order) api.get(`/orders/${id}`).then(({ data }) => setOrder(data.order)).catch(() => {})
    gsap.fromTo('.confirm-check', { scale: 0, rotate: -30 }, { scale: 1, rotate: 0, duration: 0.7, ease: 'back.out(2)' })
    gsap.fromTo('.confirm-fade', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, delay: 0.2 })
  }, [])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-4 py-10">
      <div className="confirm-check w-24 h-24 rounded-full bg-gold-gradient grid place-items-center shadow-gold-lg">
        <i className="fa-solid fa-check text-black text-4xl"></i>
      </div>
      <div className="confirm-fade">
        <h1 className="heading text-3xl text-white">Order Confirmed!</h1>
        <p className="text-soft-gold/60 text-sm mt-1">Thank you for choosing CALMER</p>
      </div>

      {order && (
        <div className="confirm-fade card p-5 w-full max-w-sm text-left space-y-2">
          <div className="flex justify-between text-sm"><span className="text-soft-gold/50">Order Number</span><span className="text-rich-gold font-mono">{order.orderNumber}</span></div>
          <div className="flex justify-between text-sm"><span className="text-soft-gold/50">Items</span><span className="text-white">{order.items?.length}</span></div>
          <div className="flex justify-between text-sm"><span className="text-soft-gold/50">Total Paid</span><span className="gold-text font-bold">${order.totalAmount?.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-soft-gold/50">Est. Delivery</span><span className="text-white">{order.estimatedDeliveryTime} min</span></div>
        </div>
      )}

      <div className="confirm-fade flex gap-3 w-full max-w-sm">
        <button onClick={() => navigate(`/track/${id}`)} className="btn-gold flex-1 py-3.5">
          <i className="fa-solid fa-location-crosshairs mr-2"></i>Track Order
        </button>
        <button onClick={() => navigate('/shop')} className="btn-ghost flex-1 py-3.5">Keep Shopping</button>
      </div>
    </div>
  )
}
