import { z } from 'zod'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ok } from '../utils/apiResponse.js'
import {
  createBroadcastList,
  sendBroadcastMessage,
  getMyBroadcasts,
  updateBroadcastList
} from '../services/broadcast.service.js'

const createSchema = z.object({
  name: z.string().min(1),
  members: z.array(z.string()).min(1)
})

const sendSchema = z.object({
  content: z.string().optional(),
  type: z.enum(['text', 'image', 'file', 'audio']).optional(),
  fileUrl: z.string().optional(),
  encryptedContent: z.string().optional(),
  encryptedKeys: z.record(z.string()).optional()
})

const updateSchema = z.object({
  members: z.array(z.string()).min(1)
})

export const createBroadcastController = asyncHandler(async (req, res) => {
  const body = createSchema.parse(req.body)
  const broadcast = await createBroadcastList({
    userId: req.user.id,
    name: body.name,
    members: body.members
  })
  return ok(res, 'Broadcast list created', broadcast)
})

export const sendBroadcastController = asyncHandler(async (req, res) => {
  const body = sendSchema.parse(req.body)
  const messages = await sendBroadcastMessage({
    userId: req.user.id,
    broadcastId: req.params.broadcastId,
    content: body.content,
    type: body.type,
    fileUrl: body.fileUrl,
    encryptedContent: body.encryptedContent,
    encryptedKeys: body.encryptedKeys
  })
  return ok(res, 'Broadcast sent', messages)
})

export const getMyBroadcastsController = asyncHandler(async (req, res) => {
  const broadcasts = await getMyBroadcasts(req.user.id)
  return ok(res, 'Broadcasts', broadcasts)
})

export const updateBroadcastController = asyncHandler(async (req, res) => {
  const body = updateSchema.parse(req.body)
  const broadcast = await updateBroadcastList({
    userId: req.user.id,
    broadcastId: req.params.broadcastId,
    members: body.members
  })
  return ok(res, 'Broadcast updated', broadcast)
})
