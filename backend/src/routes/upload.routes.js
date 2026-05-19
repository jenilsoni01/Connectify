import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { upload } from '../middlewares/upload.middleware.js'
import {
  uploadProfilePicController,
  uploadStoryController,
  uploadChatController
} from '../controllers/upload.controller.js'

const router = Router()

router.post('/profile-pic', requireAuth, upload.single('file'), uploadProfilePicController)
router.post('/story', requireAuth, upload.single('file'), uploadStoryController)
router.post('/chat', requireAuth, upload.single('file'), uploadChatController)

export default router
