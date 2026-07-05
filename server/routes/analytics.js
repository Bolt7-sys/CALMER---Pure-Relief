import { Router } from 'express'
import { overview } from '../controllers/analyticsController.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()
router.get('/overview', requireAuth, requireAdmin, overview)
export default router
