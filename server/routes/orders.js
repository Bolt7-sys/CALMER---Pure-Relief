import { Router } from 'express'
import {
  createOrder, listOrders, getOrder, updateStatus, updateLocation, rateOrder
} from '../controllers/orderController.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)
router.post('/', createOrder)
router.get('/', listOrders)
router.get('/:id', getOrder)
router.patch('/:id/status', requireAdmin, updateStatus)
router.patch('/:id/location', updateLocation)
router.patch('/:id/rate', rateOrder)
export default router
