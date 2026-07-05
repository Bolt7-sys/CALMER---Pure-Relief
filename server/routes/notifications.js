import { Router } from 'express'
import { listNotifications, markRead, markAllRead, broadcast } from '../controllers/notificationController.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)
router.get('/', listNotifications)
router.patch('/read-all', markAllRead)
router.patch('/:id/read', markRead)
router.post('/broadcast', requireAdmin, broadcast)
export default router
