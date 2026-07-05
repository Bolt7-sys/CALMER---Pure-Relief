// Central registry of all 20 CALMER images so they're bundled by Vite.
import logo from '../assets/images/logo.jpg'
import loginBg from '../assets/images/login-bg.png'
import heroHome from '../assets/images/hero-home.png'
import howItWorks from '../assets/images/how-it-works.png'
import ourServices from '../assets/images/our-services.png'
import whyChoose from '../assets/images/why-choose.png'
import productCategories from '../assets/images/product-categories.png'
import tracking from '../assets/images/tracking.png'
import testimonials from '../assets/images/testimonials.png'
import review from '../assets/images/review.png'
import shopGrid from '../assets/images/shop-grid.png'
import cart from '../assets/images/cart.png'
import deliveryAddress from '../assets/images/delivery-address.png'
import payment from '../assets/images/payment.png'
import orderConfirmed from '../assets/images/order-confirmed.png'
import profile from '../assets/images/profile.png'
import myOrders from '../assets/images/my-orders.png'
import adminDashboard from '../assets/images/admin-dashboard.png'
import adminAnalytics from '../assets/images/admin-analytics.png'
import appShowcase from '../assets/images/app-showcase.png'
import ganjaAssembled from '../assets/images/ganja-assembled.jpg'
import ganjaExplode from '../assets/images/ganja-explode.jpg'

export const IMG = {
  logo, loginBg, heroHome, howItWorks, ourServices, whyChoose,
  productCategories, tracking, testimonials, review, shopGrid, cart,
  deliveryAddress, payment, orderConfirmed, profile, myOrders,
  adminDashboard, adminAnalytics, appShowcase, ganjaAssembled, ganjaExplode
}

// Map server imageUrl paths (/images/xxx.png) -> bundled asset
const byFile = {
  'logo.jpg': logo,
  'login-bg.png': loginBg,
  'hero-home.png': heroHome,
  'how-it-works.png': howItWorks,
  'our-services.png': ourServices,
  'why-choose.png': whyChoose,
  'product-categories.png': productCategories,
  'tracking.png': tracking,
  'testimonials.png': testimonials,
  'review.png': review,
  'shop-grid.png': shopGrid,
  'cart.png': cart,
  'delivery-address.png': deliveryAddress,
  'payment.png': payment,
  'order-confirmed.png': orderConfirmed,
  'profile.png': profile,
  'my-orders.png': myOrders,
  'admin-dashboard.png': adminDashboard,
  'admin-analytics.png': adminAnalytics,
  'app-showcase.png': appShowcase
}

export function resolveImage(url) {
  if (!url) return productCategories
  if (url.startsWith('http') || url.startsWith('data:')) return url
  const file = url.split('/').pop()
  return byFile[file] || productCategories
}
