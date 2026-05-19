import Story from '../models/Story.js'
import User from '../models/User.js'
import { createNotification } from './notification.service.js'

export const createStory = async ({ userId, contentText = '', mediaUrl = '', expiresInHours = 24 }) => {
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
  const story = await Story.create({ userId, contentText, mediaUrl, expiresAt })
  const user = await User.findById(userId)
  const friendIds = user ? user.friends.map(String) : []
  await Promise.all(
    friendIds.map((id) =>
      createNotification({
        userId: id,
        type: 'story',
        fromUserId: userId,
        storyId: story._id,
        message: 'New story'
      })
    )
  )
  return story
}

/* ── Status Privacy–aware Feed ── */
export const getFeed = async (userId) => {
  const user = await User.findById(userId)
  const friendIds = user ? user.friends.map(String) : []
  const candidateIds = [userId, ...friendIds]

  /* Fetch all active stories from self + friends */
  const stories = await Story.find({
    userId: { $in: candidateIds },
    expiresAt: { $gt: new Date() }
  })
    .populate('userId', '-passwordHash')
    .populate('likes', 'name profilePic')
    .populate('viewers', 'name profilePic')
    .sort({ createdAt: -1 })

  /* Filter by each poster's statusPrivacy setting */
  return stories.filter((story) => {
    const poster = story.userId
    if (!poster) return false
    if (String(poster._id) === String(userId)) return true // always see own stories

    const privacy = poster.statusPrivacy || 'everyone'
    switch (privacy) {
      case 'everyone':
        return true
      case 'contacts':
        return poster.friends?.some((fId) => String(fId) === String(userId))
      case 'nobody':
        return false
      case 'custom': {
        const excluded = (poster.statusExcludedUsers || []).map(String)
        if (excluded.includes(String(userId))) return false
        const allowed = (poster.statusAllowedUsers || []).map(String)
        if (allowed.length > 0) return allowed.includes(String(userId))
        return true
      }
      default:
        return true
    }
  })
}

export const getUserStories = async (targetId) => {
  return Story.find({ userId: targetId, expiresAt: { $gt: new Date() } })
    .populate('userId', '-passwordHash')
    .populate('likes', 'name profilePic')
    .populate('viewers', 'name profilePic')
    .sort({ createdAt: -1 })
}

export const viewStory = async ({ userId, storyId }) => {
  const story = await Story.findByIdAndUpdate(
    storyId,
    { $addToSet: { viewers: userId } },
    { new: true }
  ).populate('viewers', 'name profilePic')
  
  if (!story) {
    const error = new Error('Story not found')
    error.statusCode = 404
    throw error
  }
  return story
}

export const deleteStory = async ({ userId, storyId }) => {
  const story = await Story.findById(storyId)
  if (!story) {
    const error = new Error('Story not found')
    error.statusCode = 404
    throw error
  }
  if (String(story.userId) !== String(userId)) {
    const error = new Error('Forbidden')
    error.statusCode = 403
    throw error
  }
  await Story.findByIdAndDelete(storyId)
  return storyId
}

export const likeStory = async ({ userId, storyId }) => {
  const story = await Story.findByIdAndUpdate(
    storyId,
    { $addToSet: { likes: userId } },
    { new: true }
  )
    .populate('userId', '-passwordHash')
    .populate('likes', 'name profilePic')
    .populate('viewers', 'name profilePic')
    
  if (!story) {
    const error = new Error('Story not found')
    error.statusCode = 404
    throw error
  }
  
  // Notify story owner
  if (String(story.userId._id) !== String(userId)) {
    await createNotification({
      userId: story.userId._id,
      type: 'story',
      fromUserId: userId,
      storyId: story._id,
      message: 'Liked your story'
    })
  }
  return story
}

export const unlikeStory = async ({ userId, storyId }) => {
  const story = await Story.findByIdAndUpdate(
    storyId,
    { $pull: { likes: userId } },
    { new: true }
  )
    .populate('userId', '-passwordHash')
    .populate('likes', 'name profilePic')
    .populate('viewers', 'name profilePic')
    
  if (!story) {
    const error = new Error('Story not found')
    error.statusCode = 404
    throw error
  }
  return story
}
