import { asyncHandler } from '../utils/asyncHandler.js'
import { ok } from '../utils/apiResponse.js'
import { getMyNotifications, markRead, markAllRead } from '../services/notification.service.js'

export const myNotificationsController = asyncHandler(async (req, res) => {
  const notifications = await getMyNotifications(req.user.id)
  return ok(res, 'Notifications', notifications)
})

export const markReadController = asyncHandler(async (req, res) => {
  const notification = await markRead(req.user.id, req.params.id)
  return ok(res, 'Notification read', notification)
})

export const markAllReadController = asyncHandler(async (req, res) => {
  const result = await markAllRead(req.user.id)
  return ok(res, 'Notifications read', result)
})
