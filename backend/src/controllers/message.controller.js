import { z } from 'zod'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ok } from '../utils/apiResponse.js'
import {
  sendMessage,
  getMessages,
  markRead,
  deleteMessage,
  reactToMessage,
  editMessage,
  forwardMessage,
  pinMessage
} from '../services/message.service.js'

const sendSchema = z.object({
  content: z.string().optional(),
  type: z.enum(['text', 'image', 'file', 'audio']).optional(),
  fileUrl: z.string().optional(),
  replyTo: z.string().optional(),
  encryptedContent: z.string().optional(),
  encryptedKeys: z.record(z.string()).optional()
})

const reactSchema = z.object({
  emoji: z.string().min(1)
})

const editSchema = z.object({
  content: z.string().optional(),
  encryptedContent: z.string().optional(),
  encryptedKeys: z.record(z.string()).optional()
})

const forwardSchema = z.object({
  targetConversationId: z.string().min(1)
})

export const sendMessageController = asyncHandler(async (req, res) => {
  const body = sendSchema.parse(req.body)
  const message = await sendMessage({
    userId: req.user.id,
    conversationId: req.params.conversationId,
    content: body.content,
    type: body.type,
    fileUrl: body.fileUrl,
    replyTo: body.replyTo || null,
    encryptedContent: body.encryptedContent,
    encryptedKeys: body.encryptedKeys
  })
  return ok(res, 'Message sent', message)
})

export const getMessagesController = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const messages = await getMessages({
    userId: req.user.id,
    conversationId: req.params.conversationId,
    page,
    limit
  })
  return ok(res, 'Messages', messages)
})

export const markReadController = asyncHandler(async (req, res) => {
  const result = await markRead({
    userId: req.user.id,
    conversationId: req.params.conversationId
  })
  return ok(res, 'Read', result)
})

export const deleteMessageController = asyncHandler(async (req, res) => {
  const message = await deleteMessage({ userId: req.user.id, messageId: req.params.messageId })
  return ok(res, 'Message deleted', message)
})

export const reactMessageController = asyncHandler(async (req, res) => {
  const body = reactSchema.parse(req.body)
  const message = await reactToMessage({
    userId: req.user.id,
    messageId: req.params.messageId,
    emoji: body.emoji
  })
  return ok(res, 'Reaction updated', message)
})

export const editMessageController = asyncHandler(async (req, res) => {
  const body = editSchema.parse(req.body)
  const message = await editMessage({
    userId: req.user.id,
    messageId: req.params.messageId,
    newContent: body.content,
    encryptedContent: body.encryptedContent,
    encryptedKeys: body.encryptedKeys
  })
  return ok(res, 'Message edited', message)
})

export const forwardMessageController = asyncHandler(async (req, res) => {
  const body = forwardSchema.parse(req.body)
  const message = await forwardMessage({
    userId: req.user.id,
    messageId: req.params.messageId,
    targetConversationId: body.targetConversationId
  })
  return ok(res, 'Message forwarded', message)
})

export const pinMessageController = asyncHandler(async (req, res) => {
  const message = await pinMessage({
    userId: req.user.id,
    messageId: req.params.messageId
  })
  return ok(res, message.isPinned ? 'Message pinned' : 'Message unpinned', message)
})
