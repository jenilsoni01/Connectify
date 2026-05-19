import { Router } from 'express'
import {
  sendRequestController,
  acceptRequestController,
  rejectRequestController,
  listFriendsController,
  listRequestsController
} from '../controllers/friend.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.post('/request/:id', requireAuth, sendRequestController)
router.post('/accept/:id', requireAuth, acceptRequestController)
router.post('/reject/:id', requireAuth, rejectRequestController)
router.get('/list', requireAuth, listFriendsController)
router.get('/requests', requireAuth, listRequestsController)

export default router
