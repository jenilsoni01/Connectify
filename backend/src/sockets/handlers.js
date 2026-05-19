import User from '../models/User.js'
import Conversation from '../models/Conversation.js'
import { socketAuth } from './socketAuth.js'
import { addUserSocket, removeSocket, emitToUsers, getSocketIds } from './socketStore.js'
import { sendMessage, markDelivered, markRead, editMessage, forwardMessage, pinMessage } from '../services/message.service.js'
import { createGroup, addMember, removeMember } from '../services/group.service.js'

const notifyStatus = async (userId, isOnline) => {
  const user = await User.findById(userId)
  if (!user) return
  const friendIds = user.friends.map(String)
  emitToUsers(friendIds, 'user:status', {
    userId: String(userId),
    isOnline,
    lastSeen: user.lastSeen
  })
}

export const registerHandlers = (socket) => {
  const authenticate = async (token) => {
    const userId = socketAuth(token)
    if (!userId) return null
    socket.data.userId = userId
    addUserSocket(userId, socket.id)
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() })
    await notifyStatus(userId, true)
    return userId
  }

  socket.on('auth:token', async (token) => {
    if (socket.data.userId) return
    await authenticate(token)
  })

  socket.on('user:online', async () => {
    if (!socket.data.userId) return
    await User.findByIdAndUpdate(socket.data.userId, { isOnline: true, lastSeen: new Date() })
    await notifyStatus(socket.data.userId, true)
  })

  socket.on('message:send', async (payload) => {
    if (!socket.data.userId) return
    await sendMessage({
      userId: socket.data.userId,
      conversationId: payload.conversationId,
      content: payload.content,
      type: payload.type,
      fileUrl: payload.fileUrl,
      replyTo: payload.replyTo || null,
      encryptedContent: payload.encryptedContent,
      encryptedKeys: payload.encryptedKeys
    })
  })

  socket.on('message:edit', async (payload) => {
    if (!socket.data.userId) return
    try {
      await editMessage({
        userId: socket.data.userId,
        messageId: payload.messageId,
        newContent: payload.content,
        encryptedContent: payload.encryptedContent,
        encryptedKeys: payload.encryptedKeys
      })
    } catch (err) {
      socket.emit('error', { message: err.message })
    }
  })

  socket.on('message:forward', async (payload) => {
    if (!socket.data.userId) return
    try {
      await forwardMessage({
        userId: socket.data.userId,
        messageId: payload.messageId,
        targetConversationId: payload.targetConversationId
      })
    } catch (err) {
      socket.emit('error', { message: err.message })
    }
  })

  socket.on('message:pin', async (payload) => {
    if (!socket.data.userId) return
    try {
      await pinMessage({
        userId: socket.data.userId,
        messageId: payload.messageId
      })
    } catch (err) {
      socket.emit('error', { message: err.message })
    }
  })

  socket.on('message:typing', async (payload) => {
    if (!socket.data.userId) return
    const conversation = await Conversation.findById(payload.conversationId)
    if (!conversation) return
    if (!conversation.members.some((id) => String(id) === String(socket.data.userId))) return
    const members = conversation.members.map(String).filter((id) => id !== String(socket.data.userId))
    emitToUsers(members, 'message:typing', {
      conversationId: payload.conversationId,
      userId: socket.data.userId,
      isTyping: Boolean(payload.isTyping)
    })
  })

  socket.on('message:delivered', async (payload) => {
    if (!socket.data.userId) return
    await markDelivered({ userId: socket.data.userId, conversationId: payload.conversationId })
  })

  socket.on('message:read', async (payload) => {
    if (!socket.data.userId) return
    await markRead({ userId: socket.data.userId, conversationId: payload.conversationId })
  })

  socket.on('group:create', async (payload) => {
    if (!socket.data.userId) return
    await createGroup({
      userId: socket.data.userId,
      name: payload.name,
      members: payload.members || [],
      groupPic: payload.groupPic || ''
    })
  })

  socket.on('group:addMember', async (payload) => {
    if (!socket.data.userId) return
    await addMember({
      userId: socket.data.userId,
      conversationId: payload.conversationId,
      memberId: payload.memberId
    })
  })

  socket.on('group:removeMember', async (payload) => {
    if (!socket.data.userId) return
    await removeMember({
      userId: socket.data.userId,
      conversationId: payload.conversationId,
      memberId: payload.memberId
    })
  })

  socket.on('disconnect', async () => {
    const userId = removeSocket(socket)
    if (!userId) return
    const remaining = await getSocketIds(userId)
    if (remaining.length === 0) {
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() })
      await notifyStatus(userId, false)
    }
  })
}
