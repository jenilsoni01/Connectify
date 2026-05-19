import { z } from 'zod'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ok } from '../utils/apiResponse.js'
import {
  createDirectConversation,
  getMyConversations,
  getConversationById,
  setDisappearingTimer,
  getPinnedMessages,
  deleteConversation,
  clearConversation
} from '../services/conversation.service.js'

const disappearingSchema = z.object({
  timer: z.number().min(0)
})

export const createConversationController = asyncHandler(async (req, res) => {
  const conversation = await createDirectConversation(req.user.id, req.params.userId)
  return ok(res, 'Conversation', conversation)
})

export const myConversationsController = asyncHandler(async (req, res) => {
  const conversations = await getMyConversations(req.user.id)
  return ok(res, 'Conversations', conversations)
})

export const getConversationController = asyncHandler(async (req, res) => {
  const conversation = await getConversationById(req.user.id, req.params.id)
  return ok(res, 'Conversation', conversation)
})

export const setDisappearingController = asyncHandler(async (req, res) => {
  const body = disappearingSchema.parse(req.body)
  const conversation = await setDisappearingTimer(req.user.id, req.params.id, body.timer)
  return ok(res, 'Disappearing timer updated', conversation)
})

export const getPinnedController = asyncHandler(async (req, res) => {
  const messages = await getPinnedMessages(req.user.id, req.params.id)
  return ok(res, 'Pinned messages', messages)
})

export const deleteConversationController = asyncHandler(async (req, res) => {
  const result = await deleteConversation(req.user.id, req.params.id)
  return ok(res, 'Conversation deleted', result)
})

export const clearConversationController = asyncHandler(async (req, res) => {
  const result = await clearConversation(req.user.id, req.params.id)
  return ok(res, 'Conversation cleared', result)
})
