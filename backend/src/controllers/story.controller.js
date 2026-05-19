import { z } from 'zod'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ok } from '../utils/apiResponse.js'
import { 
  createStory, 
  getFeed, 
  getUserStories, 
  viewStory,
  deleteStory,
  likeStory,
  unlikeStory
} from '../services/story.service.js'

const createSchema = z.object({
  contentText: z.string().optional(),
  mediaUrl: z.string().optional(),
  expiresInHours: z.number().optional()
})

export const createStoryController = asyncHandler(async (req, res) => {
  const body = createSchema.parse(req.body)
  const story = await createStory({
    userId: req.user.id,
    contentText: body.contentText || '',
    mediaUrl: body.mediaUrl || '',
    expiresInHours: body.expiresInHours
  })
  return ok(res, 'Story created', story)
})

export const feedController = asyncHandler(async (req, res) => {
  const stories = await getFeed(req.user.id)
  return ok(res, 'Stories', stories)
})

export const userStoriesController = asyncHandler(async (req, res) => {
  const stories = await getUserStories(req.params.id)
  return ok(res, 'Stories', stories)
})

export const viewStoryController = asyncHandler(async (req, res) => {
  const story = await viewStory({ userId: req.user.id, storyId: req.params.storyId })
  return ok(res, 'Story viewed', story)
})

export const deleteStoryController = asyncHandler(async (req, res) => {
  await deleteStory({ userId: req.user.id, storyId: req.params.storyId })
  return ok(res, 'Story deleted')
})

export const likeStoryController = asyncHandler(async (req, res) => {
  const story = await likeStory({ userId: req.user.id, storyId: req.params.storyId })
  return ok(res, 'Story liked', story)
})

export const unlikeStoryController = asyncHandler(async (req, res) => {
  const story = await unlikeStory({ userId: req.user.id, storyId: req.params.storyId })
  return ok(res, 'Story unliked', story)
})
