import { Router } from 'express'
import {
  sendMessageController,
  getMessagesController,
  markReadController,
  deleteMessageController,
  reactMessageController,
  editMessageController,
  forwardMessageController,
  pinMessageController
} from '../controllers/message.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.post('/send/:conversationId', requireAuth, sendMessageController)
router.get('/:conversationId', requireAuth, getMessagesController)
router.put('/read/:conversationId', requireAuth, markReadController)
router.put('/delete/:messageId', requireAuth, deleteMessageController)
router.post('/react/:messageId', requireAuth, reactMessageController)
router.put('/edit/:messageId', requireAuth, editMessageController)
router.post('/forward/:messageId', requireAuth, forwardMessageController)
router.put('/pin/:messageId', requireAuth, pinMessageController)

export default router
