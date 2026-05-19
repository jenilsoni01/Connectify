import { Router } from 'express'
import {
  createStoryController,
  feedController,
  userStoriesController,
  viewStoryController,
  deleteStoryController,
  likeStoryController,
  unlikeStoryController
} from '../controllers/story.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.post('/create', requireAuth, createStoryController)
router.get('/feed', requireAuth, feedController)
router.get('/user/:id', requireAuth, userStoriesController)
router.put('/view/:storyId', requireAuth, viewStoryController)
router.delete('/:storyId', requireAuth, deleteStoryController)
router.post('/:storyId/like', requireAuth, likeStoryController)
router.delete('/:storyId/like', requireAuth, unlikeStoryController)

export default router
