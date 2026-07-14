import { Router } from 'express'
import {
  createOrder, quoteOrder, listOrders, getOrder, updateStatus, cancelOrder, updateLocation, rateOrder
} from '../controllers/orderController.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'

const router = Router()
router.use(requireAuth)
router.post('/quote', quoteOrder)                       // price + promo validation before payment
router.post('/', rateLimit({ windowMs: 60_000, max: 10 }), createOrder) // checkout spam guard
router.get('/', listOrders)
router.get('/:id', getOrder)
router.patch('/:id/status', requireAdmin, updateStatus)
router.patch('/:id/cancel', cancelOrder)                // client cancels own processing order
router.patch('/:id/location', updateLocation)
router.patch('/:id/rate', rateOrder)
export default router
