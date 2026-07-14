import { Router } from 'express'
import { register, login, me, updateProfile, listFavorites, toggleFavorite } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'

const router = Router()
// Brute-force protection: 20 auth attempts / 10 min per IP
router.post('/register', rateLimit({ windowMs: 10 * 60 * 1000, max: 20 }), register)
router.post('/login', rateLimit({ windowMs: 10 * 60 * 1000, max: 20 }), login)
router.get('/me', requireAuth, me)
router.patch('/profile', requireAuth, updateProfile)
router.get('/favorites', requireAuth, listFavorites)
router.post('/favorites/:productId', requireAuth, toggleFavorite)
export default router
