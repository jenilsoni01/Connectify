import { Router } from 'express'
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  logoutAllController,
  meController,
  getDevicesController,
  revokeDeviceController
} from '../controllers/auth.controller.js'
import { authLimiter } from '../middlewares/rateLimit.middleware.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.post('/register', authLimiter, registerController)
router.post('/login', authLimiter, loginController)
router.post('/refresh', refreshController)
router.post('/logout', requireAuth, logoutController)
router.post('/logout-all', requireAuth, logoutAllController)
router.get('/me', requireAuth, meController)
router.get('/devices', requireAuth, getDevicesController)
router.delete('/devices/:tokenId', requireAuth, revokeDeviceController)

export default router
