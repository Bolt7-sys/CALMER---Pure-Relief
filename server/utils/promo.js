// CALMER promo codes — server-side only so clients can't invent discounts.
// type: 'percent' (of subtotal) | 'flat' ($ off subtotal) | 'freedelivery'
export const PROMOS = {
  'CALM10':    { type: 'percent', value: 10, label: '10% off your order' },
  'ELEVATE20': { type: 'percent', value: 20, label: '20% off — Elevate special', minSubtotal: 100 },
  'GOLDENLEAF':{ type: 'flat', value: 15, label: '$15 off', minSubtotal: 60 },
  'FREESHIP':  { type: 'freedelivery', value: 0, label: 'Free delivery' }
}

export function applyPromo(code, subtotal, deliveryFee) {
  const clean = String(code || '').trim().toUpperCase()
  if (!clean) return { valid: false, error: 'Enter a promo code.' }
  const promo = PROMOS[clean]
  if (!promo) return { valid: false, error: 'Invalid promo code.' }
  if (promo.minSubtotal && subtotal < promo.minSubtotal) {
    return { valid: false, error: `Requires a subtotal of $${promo.minSubtotal}+.` }
  }
  let discount = 0
  let delivery = deliveryFee
  if (promo.type === 'percent') discount = +(subtotal * promo.value / 100).toFixed(2)
  else if (promo.type === 'flat') discount = Math.min(promo.value, subtotal)
  else if (promo.type === 'freedelivery') { delivery = 0 }
  return { valid: true, code: clean, label: promo.label, discount, deliveryFee: delivery }
}
