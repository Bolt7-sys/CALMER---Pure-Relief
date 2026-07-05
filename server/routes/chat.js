import { Router } from 'express'
import { listMessages, sendMessage } from '../controllers/chatController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)
router.get('/:orderId', listMessages)
router.post('/:orderId', sendMessage)
export default router
