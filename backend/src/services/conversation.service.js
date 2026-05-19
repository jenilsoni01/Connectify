import Conversation from '../models/Conversation.js'
import Group from '../models/Group.js'
import User from '../models/User.js'
import Message from '../models/Message.js'

const ensureUser = async (id) => {
  const user = await User.findById(id)
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }
  return user
}

export const createDirectConversation = async (userId, otherUserId) => {
  if (String(userId) === String(otherUserId)) {
    const error = new Error('Invalid user')
    error.statusCode = 400
    throw error
  }
  const [user, other] = await Promise.all([ensureUser(userId), ensureUser(otherUserId)])
  if (user.blockedUsers.includes(other._id) || other.blockedUsers.includes(user._id)) {
    const error = new Error('User is blocked')
    error.statusCode = 403
    throw error
  }
  const existing = await Conversation.findOne({
    isGroup: false,
    isBroadcast: { $ne: true },
    members: { $all: [userId, otherUserId], $size: 2 }
  })
  if (existing) return existing
  return Conversation.create({ isGroup: false, members: [userId, otherUserId] })
}

export const getMyConversations = async (userId) => {
  const conversations = await Conversation.find({
    $or: [
      { members: userId, isBroadcast: { $ne: true } },
      { isBroadcast: true, broadcastCreator: userId }
    ]
  })
    .populate('members', '-passwordHash')
    .populate('lastMessageId')
    .sort({ updatedAt: -1 })

  const groupIds = conversations.filter((c) => c.isGroup).map((c) => c._id)
  const groups = await Group.find({ conversationId: { $in: groupIds } })
  const groupMap = new Map(groups.map((g) => [String(g.conversationId), g]))

  const results = []
  for (const conv of conversations) {
    const unreadCount = await Message.countDocuments({
      conversationId: conv._id,
      senderId: { $ne: userId },
      'readBy.userId': { $ne: userId },
      isDeleted: false
    })
    results.push({
      ...conv.toObject(),
      group: conv.isGroup ? groupMap.get(String(conv._id)) : null,
      unreadCount
    })
  }
  return results
}

export const getConversationById = async (userId, conversationId) => {
  const conversation = await Conversation.findById(conversationId)
    .populate('members', '-passwordHash')
    .populate('lastMessageId')
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
  const group = conversation.isGroup
    ? await Group.findOne({ conversationId: conversation._id })
    : null
  return { ...conversation.toObject(), group }
}

/* ── Disappearing Messages Timer ── */
export const setDisappearingTimer = async (userId, conversationId, timer) => {
  const conversation = await Conversation.findById(conversationId)
  if (!conversation) {
    const error = new Error('Conversation not found')
    error.statusCode = 404
    throw error
  }
  if (!conversation.members.some((m) => String(m) === String(userId))) {
    const error = new Error('Forbidden')
    error.statusCode = 403
    throw error
  }
  conversation.disappearingTimer = Number(timer) || 0
  await conversation.save()
  return conversation
}

/* ── Get Pinned Messages ── */
export const getPinnedMessages = async (userId, conversationId) => {
  const conversation = await Conversation.findById(conversationId)
  if (!conversation) {
    const error = new Error('Conversation not found')
    error.statusCode = 404
    throw error
  }
  if (!conversation.members.some((m) => String(m) === String(userId))) {
    const error = new Error('Forbidden')
    error.statusCode = 403
    throw error
  }
  return Message.find({
    conversationId,
    isPinned: true,
    isDeleted: false
  }).sort({ createdAt: -1 })
}

export const deleteConversation = async (userId, conversationId) => {
  const conversation = await Conversation.findById(conversationId)
  if (!conversation) {
    const error = new Error('Conversation not found')
    error.statusCode = 404
    throw error
  }
  const isMember = conversation.members.some((m) => String(m) === String(userId))
  const isCreator = conversation.isBroadcast && String(conversation.broadcastCreator) === String(userId)
  if (!isMember && !isCreator) {
    const error = new Error('Forbidden')
    error.statusCode = 403
    throw error
  }
  await Message.deleteMany({ conversationId })
  if (conversation.isGroup) {
    await Group.deleteOne({ conversationId })
  }
  await Conversation.findByIdAndDelete(conversationId)
  return { conversationId }
}

export const clearConversation = async (userId, conversationId) => {
  const conversation = await Conversation.findById(conversationId)
  if (!conversation) {
    const error = new Error('Conversation not found')
    error.statusCode = 404
    throw error
  }
  const isMember = conversation.members.some((m) => String(m) === String(userId))
  const isCreator = conversation.isBroadcast && String(conversation.broadcastCreator) === String(userId)
  if (!isMember && !isCreator) {
    const error = new Error('Forbidden')
    error.statusCode = 403
    throw error
  }
  await Message.deleteMany({ conversationId })
  conversation.lastMessageId = null
  await conversation.save()
  return { conversationId }
}
