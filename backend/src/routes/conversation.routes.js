import { Router } from 'express'
import {
  createConversationController,
  myConversationsController,
  getConversationController,
  setDisappearingController,
  getPinnedController,
  deleteConversationController,
  clearConversationController
} from '../controllers/conversation.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.post('/create/:userId', requireAuth, createConversationController)
router.get('/my', requireAuth, myConversationsController)
router.get('/:id', requireAuth, getConversationController)
router.put('/:id/disappearing', requireAuth, setDisappearingController)
router.get('/:id/pinned', requireAuth, getPinnedController)
router.delete('/:id', requireAuth, deleteConversationController)
router.delete('/:id/clear', requireAuth, clearConversationController)

export default router
