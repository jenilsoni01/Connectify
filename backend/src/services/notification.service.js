import Notification from '../models/Notification.js'
import { emitToUser } from '../sockets/socketStore.js'

export const createNotification = async ({
  userId,
  type,
  fromUserId = null,
  conversationId = null,
  storyId = null,
  message = ''
}) => {
  const notification = await Notification.create({
    userId,
    type,
    fromUserId,
    conversationId,
    storyId,
    message
  })
  emitToUser(String(userId), 'notification:new', notification)
  return notification
}

export const getMyNotifications = async (userId) => {
  return Notification.find({ userId }).sort({ createdAt: -1 })
}

export const markRead = async (userId, id) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { isRead: true },
    { new: true }
  )
  if (!notification) {
    const error = new Error('Notification not found')
    error.statusCode = 404
    throw error
  }
  return notification
}

export const markAllRead = async (userId) => {
  await Notification.updateMany({ userId }, { isRead: true })
  return { userId }
}
