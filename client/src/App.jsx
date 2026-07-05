import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Public
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'

// Client
import ClientLayout from './layouts/ClientLayout'
import Home from './pages/client/Home'
import Shop from './pages/client/Shop'
import ProductDetail from './pages/client/ProductDetail'
import CartPage from './pages/client/CartPage'
import Checkout from './pages/client/Checkout'
import OrderConfirmed from './pages/client/OrderConfirmed'
import Orders from './pages/client/Orders'
import Tracking from './pages/client/Tracking'
import Chat from './pages/client/Chat'
import Profile from './pages/client/Profile'
import Notifications from './pages/client/Notifications'

// Admin
import AdminLayout from './layouts/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import AdminOrders from './pages/admin/AdminOrders'
import AdminProducts from './pages/admin/AdminProducts'
import AdminTracking from './pages/admin/AdminTracking'
import AdminChat from './pages/admin/AdminChat'
import Analytics from './pages/admin/Analytics'

function Splash() {
  return (
    <div className="h-screen grid place-items-center bg-dark-radial">
      <div className="text-center">
        <div className="font-brand text-4xl gold-text animate-pulse">CALMER</div>
        <div className="text-xs tracking-[0.4em] text-soft-gold/60 mt-2">BREATHE · UNWIND · ELEVATE</div>
      </div>
    </div>
  )
}

function Protected({ role, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/welcome" state={{ from: location }} replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />
  }
  return children
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <Splash />

  return (
    <Routes>
      {/* Public cinematic landing */}
      <Route path="/welcome" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace /> : <Landing />} />
      <Route path="/auth" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace /> : <AuthPage />} />

      {/* Client app */}
      <Route element={<Protected role="client"><ClientLayout /></Protected>}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/:id/confirmed" element={<OrderConfirmed />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/track/:id" element={<Tracking />} />
        <Route path="/chat/:id" element={<Chat />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Admin dashboard */}
      <Route element={<Protected role="admin"><AdminLayout /></Protected>}>
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/tracking" element={<AdminTracking />} />
        <Route path="/admin/chat" element={<AdminChat />} />
        <Route path="/admin/analytics" element={<Analytics />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/') : '/welcome'} replace />} />
    </Routes>
  )
}
