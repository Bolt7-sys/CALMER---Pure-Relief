import { store } from '../data/store.js'

// GET /api/analytics/overview (admin)
export async function overview(req, res) {
  try {
    const orders = await store.listOrders({})
    const products = await store.listProducts()
    const clientCount = await store.countUsersByRole('client')

    const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0)
    const delivered = orders.filter(o => o.deliveryStatus === 'delivered').length
    const active = orders.filter(o => o.deliveryStatus !== 'delivered').length
    const rated = orders.filter(o => o.rating)
    const avgRating = rated.length ? (rated.reduce((s, o) => s + o.rating, 0) / rated.length) : 0

    // Revenue by day (last 7 days)
    const days = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      days[d.toISOString().slice(0, 10)] = 0
    }
    orders.forEach(o => {
      const key = new Date(o.createdAt).toISOString().slice(0, 10)
      if (key in days) days[key] += Number(o.totalAmount || 0)
    })

    // Top products by quantity sold
    const prodMap = {}
    orders.forEach(o => (o.items || []).forEach(it => {
      prodMap[it.name] = (prodMap[it.name] || 0) + Number(it.quantity || 0)
    }))
    const topProducts = Object.entries(prodMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty).slice(0, 5)

    // Category distribution
    const catMap = {}
    products.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + 1 })

    return res.json({
      totals: {
        revenue: totalRevenue,
        orders: orders.length,
        activeOrders: active,
        deliveredOrders: delivered,
        clients: clientCount,
        products: products.length,
        avgRating: Number(avgRating.toFixed(2))
      },
      revenueByDay: Object.entries(days).map(([date, amount]) => ({ date, amount })),
      topProducts,
      categoryDistribution: Object.entries(catMap).map(([category, count]) => ({ category, count }))
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load analytics', detail: err.message })
  }
}
