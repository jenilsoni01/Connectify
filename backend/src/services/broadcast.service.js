import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import User from '../models/User.js'
import { emitToUsers } from '../sockets/socketStore.js'
import { sendMessage } from './message.service.js'
import { createNotification } from './notification.service.js'

/* ── Create Broadcast List ── */
export const createBroadcastList = async ({ userId, name, members = [] }) => {
  const uniqueMembers = Array.from(new Set([userId, ...members].map(String)))
  const conversation = await Conversation.create({
    isGroup: false,
    isBroadcast: true,
    broadcastCreator: userId,
    members: uniqueMembers
  })
  return conversation
}

/* ── Send to Broadcast ── */
export const sendBroadcastMessage = async ({ userId, broadcastId, content, type, fileUrl, encryptedContent, encryptedKeys }) => {
  const broadcast = await Conversation.findById(broadcastId)
  if (!broadcast || !broadcast.isBroadcast) {
    const error = new Error('Broadcast not found')
    error.statusCode = 404
    throw error
  }
  if (String(broadcast.broadcastCreator) !== String(userId)) {
    const error = new Error('Only the creator can send to this broadcast')
    error.statusCode = 403
    throw error
  }

  const recipients = broadcast.members.filter((id) => String(id) !== String(userId))
  const results = []

  for (const recipientId of recipients) {
    /* Find or create direct conversation with each recipient */
    let dm = await Conversation.findOne({
      isGroup: false,
      isBroadcast: { $ne: true },
      members: { $all: [userId, recipientId], $size: 2 }
    })
    if (!dm) {
      dm = await Conversation.create({ isGroup: false, members: [userId, recipientId] })
    }
    const msg = await sendMessage({
      userId,
      conversationId: dm._id,
      content: content || '',
      type: type || 'text',
      fileUrl: fileUrl || '',
      encryptedContent,
      encryptedKeys
    })
    results.push(msg)
  }

  return results
}

/* ── Get My Broadcasts ── */
export const getMyBroadcasts = async (userId) => {
  return Conversation.find({ isBroadcast: true, broadcastCreator: userId })
    .populate('members', '-passwordHash')
    .sort({ updatedAt: -1 })
}

/* ── Update Broadcast Members ── */
export const updateBroadcastList = async ({ userId, broadcastId, members }) => {
  const broadcast = await Conversation.findById(broadcastId)
  if (!broadcast || !broadcast.isBroadcast) {
    const error = new Error('Broadcast not found')
    error.statusCode = 404
    throw error
  }
  if (String(broadcast.broadcastCreator) !== String(userId)) {
    const error = new Error('Forbidden')
    error.statusCode = 403
    throw error
  }
  const uniqueMembers = Array.from(new Set([userId, ...members].map(String)))
  broadcast.members = uniqueMembers
  await broadcast.save()
  return broadcast
}
