import Conversation from '../models/Conversation.js'
import Group from '../models/Group.js'
import Message from '../models/Message.js'
import User from '../models/User.js'
import { emitToUsers } from '../sockets/socketStore.js'
import { createNotification } from './notification.service.js'

const ensureConversationAccess = async (userId, conversationId) => {
  const conversation = await Conversation.findById(conversationId)
  if (!conversation) {
    const error = new Error('Conversation not found')
    error.statusCode = 404
    throw error
  }
  if (!conversation.members.some((m) => String(m._id || m) === String(userId))) {
    const error = new Error('Forbidden')
    error.statusCode = 403
    throw error
  }
  return conversation
}

export const sendMessage = async ({
  userId,
  conversationId,
  content,
  type,
  fileUrl,
  replyTo,
  forwardedFrom,
  encryptedContent,
  encryptedKeys
}) => {
  const conversation = await ensureConversationAccess(userId, conversationId)
  if (!content && !fileUrl && !encryptedContent) {
    const error = new Error('Message is empty')
    error.statusCode = 400
    throw error
  }
  if (conversation.isGroup) {
    const group = await Group.findOne({ conversationId })
    if (group?.onlyAdminsCanSend) {
      const isAdmin = group.admins.some((id) => String(id) === String(userId))
      if (!isAdmin) {
        const error = new Error('Only admins can send messages')
        error.statusCode = 403
        throw error
      }
    }
  }
  if (!conversation.isGroup && !conversation.isBroadcast) {
    const [user, other] = await Promise.all([
      User.findById(userId),
      User.findById(conversation.members.find((id) => String(id) !== String(userId)))
    ])
    if (user.blockedUsers.includes(other._id) || other.blockedUsers.includes(user._id)) {
      const error = new Error('User is blocked')
      error.statusCode = 403
      throw error
    }
  }

  const messageData = {
    conversationId,
    senderId: userId,
    content: content || '',
    type: type || 'text',
    fileUrl: fileUrl || '',
    deliveredTo: [{ userId }],
    readBy: [{ userId }]
  }

  /* Reply / Forward */
  if (replyTo) messageData.replyTo = replyTo
  if (forwardedFrom) messageData.forwardedFrom = forwardedFrom

  /* E2E encrypted payload */
  if (encryptedContent) messageData.encryptedContent = encryptedContent
  if (encryptedKeys) messageData.encryptedKeys = encryptedKeys

  /* Disappearing messages */
  if (conversation.disappearingTimer > 0) {
    messageData.expiresAt = new Date(Date.now() + conversation.disappearingTimer * 1000)
  }

  const message = await Message.create(messageData)
  const populated = await Message.findById(message._id).populate('replyTo')

  await Conversation.findByIdAndUpdate(conversationId, { lastMessageId: message._id }, { new: true })

  const memberIds = conversation.members.map((id) => String(id))
  emitToUsers(memberIds, 'message:new', populated)

  await Promise.all(
    memberIds
      .filter((id) => String(id) !== String(userId))
      .map((id) =>
        createNotification({
          userId: id,
          type: 'message',
          fromUserId: userId,
          conversationId,
          message: 'New message'
        })
      )
  )

  return populated
}

export const getMessages = async ({ userId, conversationId, page = 1, limit = 20 }) => {
  await ensureConversationAccess(userId, conversationId)
  const skip = (Number(page) - 1) * Number(limit)
  const messages = await Message.find({ conversationId })
    .populate('replyTo')
    .populate('forwardedFrom')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
  return messages.reverse()
}

export const markRead = async ({ userId, conversationId }) => {
  const conversation = await ensureConversationAccess(userId, conversationId)
  await Message.updateMany(
    { conversationId, 'readBy.userId': { $ne: userId } },
    { $addToSet: { readBy: { userId, at: new Date() } } }
  )
  const memberIds = conversation.members.map((id) => String(id))
  emitToUsers(memberIds, 'message:readUpdate', { conversationId, userId })
  return { conversationId }
}

export const markDelivered = async ({ userId, conversationId }) => {
  const conversation = await ensureConversationAccess(userId, conversationId)
  await Message.updateMany(
    { conversationId, 'deliveredTo.userId': { $ne: userId } },
    { $addToSet: { deliveredTo: { userId, at: new Date() } } }
  )
  const memberIds = conversation.members.map((id) => String(id))
  emitToUsers(memberIds, 'message:deliveredUpdate', { conversationId, userId })
  return { conversationId }
}

export const deleteMessage = async ({ userId, messageId }) => {
  const message = await Message.findById(messageId)
  if (!message) {
    const error = new Error('Message not found')
    error.statusCode = 404
    throw error
  }
  if (String(message.senderId) !== String(userId)) {
    const error = new Error('Forbidden')
    error.statusCode = 403
    throw error
  }
  message.isDeleted = true
  message.content = ''
  message.fileUrl = ''
  message.encryptedContent = ''
  message.encryptedKeys = new Map()
  await message.save()
  return message
}

export const reactToMessage = async ({ userId, messageId, emoji }) => {
  const message = await Message.findById(messageId)
  if (!message) {
    const error = new Error('Message not found')
    error.statusCode = 404
    throw error
  }
  const conversation = await ensureConversationAccess(userId, message.conversationId)
  const existing = message.reactions.find((r) => String(r.userId) === String(userId))
  if (existing) {
    existing.emoji = emoji
  } else {
    message.reactions.push({ userId, emoji })
  }
  await message.save()
  const memberIds = conversation.members.map((id) => String(id))
  emitToUsers(memberIds, 'message:updated', message)
  return message
}

/* ── Message Edit ── */
export const editMessage = async ({ userId, messageId, newContent, encryptedContent, encryptedKeys }) => {
  const message = await Message.findById(messageId)
  if (!message) {
    const error = new Error('Message not found')
    error.statusCode = 404
    throw error
  }
  if (String(message.senderId) !== String(userId)) {
    const error = new Error('Forbidden')
    error.statusCode = 403
    throw error
  }
  if (message.isDeleted) {
    const error = new Error('Cannot edit deleted message')
    error.statusCode = 400
    throw error
  }

  // Push either the plaintext or encrypted content to history depending on what it currently is
  const historyContent = message.encryptedContent ? message.encryptedContent : message.content
  message.editHistory.push({ content: historyContent, editedAt: new Date() })
  
  if (encryptedContent) {
    message.encryptedContent = encryptedContent
    message.content = ''
  } else {
    message.content = newContent
    message.encryptedContent = ''
  }

  if (encryptedKeys) {
    message.encryptedKeys = encryptedKeys
  }
  
  message.isEdited = true
  await message.save()

  const conversation = await Conversation.findById(message.conversationId)
  const memberIds = conversation.members.map((id) => String(id))
  emitToUsers(memberIds, 'message:updated', message)
  return message
}

/* ── Forward Message ── */
export const forwardMessage = async ({ userId, messageId, targetConversationId }) => {
  const original = await Message.findById(messageId)
  if (!original) {
    const error = new Error('Message not found')
    error.statusCode = 404
    throw error
  }
  return sendMessage({
    userId,
    conversationId: targetConversationId,
    content: original.content,
    type: original.type,
    fileUrl: original.fileUrl,
    forwardedFrom: original._id
  })
}

/* ── Pin / Unpin Message ── */
export const pinMessage = async ({ userId, messageId }) => {
  const message = await Message.findById(messageId)
  if (!message) {
    const error = new Error('Message not found')
    error.statusCode = 404
    throw error
  }
  const conversation = await ensureConversationAccess(userId, message.conversationId)

  message.isPinned = !message.isPinned
  await message.save()

  if (message.isPinned) {
    await Conversation.findByIdAndUpdate(message.conversationId, {
      $addToSet: { pinnedMessages: message._id }
    })
  } else {
    await Conversation.findByIdAndUpdate(message.conversationId, {
      $pull: { pinnedMessages: message._id }
    })
  }

  const memberIds = conversation.members.map((id) => String(id))
  emitToUsers(memberIds, 'message:pinned', { messageId: message._id, isPinned: message.isPinned, conversationId: message.conversationId })
  return message
}
