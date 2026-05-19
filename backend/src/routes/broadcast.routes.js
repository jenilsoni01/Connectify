import { Router } from 'express'
import {
  createBroadcastController,
  sendBroadcastController,
  getMyBroadcastsController,
  updateBroadcastController
} from '../controllers/broadcast.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.post('/create', requireAuth, createBroadcastController)
router.post('/send/:broadcastId', requireAuth, sendBroadcastController)
router.get('/my', requireAuth, getMyBroadcastsController)
router.put('/update/:broadcastId', requireAuth, updateBroadcastController)

export default router
