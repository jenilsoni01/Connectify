import { Router } from 'express'
import {
  searchUsersController,
  getUserController,
  updateUserController,
  blockUserController,
  reportUserController,
  starMessageController,
  unstarMessageController,
  getStarredController,
  updateStatusPrivacyController,
  updatePublicKeyController,
  getPublicKeysController
} from '../controllers/user.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.get('/search', requireAuth, searchUsersController)
router.get('/starred', requireAuth, getStarredController)
router.get('/:id', requireAuth, getUserController)
router.put('/update', requireAuth, updateUserController)
router.put('/block/:id', requireAuth, blockUserController)
router.post('/report/:id', requireAuth, reportUserController)
router.post('/star/:messageId', requireAuth, starMessageController)
router.delete('/star/:messageId', requireAuth, unstarMessageController)
router.put('/status-privacy', requireAuth, updateStatusPrivacyController)
router.put('/public-key', requireAuth, updatePublicKeyController)
router.post('/public-keys', requireAuth, getPublicKeysController)

export default router
