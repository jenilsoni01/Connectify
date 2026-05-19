import { Router } from 'express'
import {
  myNotificationsController,
  markReadController,
  markAllReadController
} from '../controllers/notification.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.get('/my', requireAuth, myNotificationsController)
router.put('/read/:id', requireAuth, markReadController)
router.put('/read-all', requireAuth, markAllReadController)

export default router
