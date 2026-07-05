// Seeds demo data (products + a demo admin & client) if the store is empty.
// Passkeys for demo accounts are FIXED so you can log in right away in dev.
import { store } from './data/store.js'
import { hashPasskey } from './utils/auth.js'

const DEMO_ADMIN = { username: '@admin-calmer', passkey: 'CALMER-ADMIN-ADMN-CALM-GOLD' }
const DEMO_CLIENT = { username: '@wellness', passkey: 'CALMER-USER-CALM-GOLD' }

// Products reference client-served image paths (client/src/assets/images/*)
const PRODUCTS = [
  { name: 'Golden Haze Flower', category: 'Flower', price: 45, thcContent: '22%', cbdContent: '0.5%', stock: 40, featured: true, isNewArrival: true, imageUrl: '/images/product-categories.png', description: 'Premium sun-grown flower with a smooth, calming finish.' },
  { name: 'Serenity CBD Oil', category: 'Oils', price: 60, thcContent: '0%', cbdContent: '30%', stock: 30, featured: true, imageUrl: '/images/our-services.png', description: 'Full-spectrum CBD oil to unwind and restore balance.' },
  { name: 'Elevate Gummies', category: 'Edibles', price: 25, thcContent: '10mg', cbdContent: '10mg', stock: 80, isNewArrival: true, imageUrl: '/images/shop-grid.png', description: 'Balanced 1:1 gummies for a gentle, elevated calm.' },
  { name: 'Midnight Vape Pen', category: 'Vapes', price: 55, thcContent: '85%', cbdContent: '2%', stock: 25, featured: true, imageUrl: '/images/why-choose.png', description: 'Discreet, potent vape for evening relaxation.' },
  { name: 'Amber Concentrate', category: 'Concentrates', price: 70, thcContent: '78%', cbdContent: '1%', stock: 15, imageUrl: '/images/how-it-works.png', description: 'Golden live-resin concentrate, rich in terpenes.' },
  { name: 'Breathe Pre-Roll Pack', category: 'Flower', price: 35, thcContent: '20%', cbdContent: '1%', stock: 50, isNewArrival: true, imageUrl: '/images/testimonials.png', description: 'Five hand-rolled pre-rolls for effortless calm.' },
  { name: 'Unwind Tincture', category: 'Oils', price: 48, thcContent: '5%', cbdContent: '20%', stock: 35, imageUrl: '/images/review.png', description: 'Fast-acting tincture to melt away the day.' },
  { name: 'Zen Chocolate Bar', category: 'Edibles', price: 30, thcContent: '100mg', cbdContent: '0%', stock: 60, imageUrl: '/images/app-showcase.png', description: 'Artisan dark chocolate infused for deep relaxation.' }
]

export async function seedIfEmpty() {
  try {
    const existing = await store.listProducts()
    if (existing.length > 0) return

    // Demo accounts
    if (!(await store.findUserByUsername(DEMO_ADMIN.username))) {
      await store.createUser({
        username: DEMO_ADMIN.username, passkey: await hashPasskey(DEMO_ADMIN.passkey),
        role: 'admin', fullName: 'CALMER Admin', email: 'admin@calmer.app', isActive: true
      })
    }
    if (!(await store.findUserByUsername(DEMO_CLIENT.username))) {
      await store.createUser({
        username: DEMO_CLIENT.username, passkey: await hashPasskey(DEMO_CLIENT.passkey),
        role: 'client', fullName: 'Demo Client', email: 'client@calmer.app', isActive: true
      })
    }

    for (const p of PRODUCTS) await store.createProduct(p)

    console.log('🌱 Seeded demo products and accounts.')
    console.log(`   Admin  → ${DEMO_ADMIN.username} / ${DEMO_ADMIN.passkey}`)
    console.log(`   Client → ${DEMO_CLIENT.username} / ${DEMO_CLIENT.passkey}`)
  } catch (err) {
    console.error('Seeding skipped:', err.message)
  }
}
