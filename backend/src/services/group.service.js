import Conversation from '../models/Conversation.js'
import Group from '../models/Group.js'
import User from '../models/User.js'
import { emitToUsers } from '../sockets/socketStore.js'
import { createNotification } from './notification.service.js'

const ensureGroup = async (conversationId) => {
  const group = await Group.findOne({ conversationId })
  if (!group) {
    const error = new Error('Group not found')
    error.statusCode = 404
    throw error
  }
  return group
}

const ensureMember = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId)
  if (!conversation) {
    const error = new Error('Conversation not found')
    error.statusCode = 404
    throw error
  }
  if (!conversation.members.some((id) => String(id) === String(userId))) {
    const error = new Error('Forbidden')
    error.statusCode = 403
    throw error
  }
  return conversation
}

const ensureAdmin = (group, userId) => {
  if (!group.admins.some((id) => String(id) === String(userId))) {
    const error = new Error('Forbidden')
    error.statusCode = 403
    throw error
  }
}

const isAdmin = (group, userId) => group.admins.some((id) => String(id) === String(userId))

export const createGroup = async ({
  userId,
  name,
  members = [],
  groupPic = '',
  onlyAdminsCanSend = false,
  onlyAdminsCanEdit = false,
  onlyAdminsCanAdd = false
}) => {
  const uniqueMembers = Array.from(new Set([userId, ...members].map(String)))
  const conversation = await Conversation.create({
    isGroup: true,
    members: uniqueMembers
  })
  const group = await Group.create({
    conversationId: conversation._id,
    name,
    groupPic,
    onlyAdminsCanSend,
    onlyAdminsCanEdit,
    onlyAdminsCanAdd,
    admins: [userId],
    createdBy: userId
  })
  emitToUsers(uniqueMembers, 'group:updated', { conversationId: conversation._id, group })
  await Promise.all(
    uniqueMembers
      .filter((id) => String(id) !== String(userId))
      .map((id) =>
        createNotification({
          userId: id,
          type: 'group_invite',
          fromUserId: userId,
          conversationId: conversation._id,
          message: 'Added to group'
        })
      )
  )
  return { conversation, group }
}

export const addMember = async ({ userId, conversationId, memberId }) => {
  const group = await ensureGroup(conversationId)
  await ensureMember(conversationId, userId)
  if (group.onlyAdminsCanAdd && !isAdmin(group, userId)) {
    const error = new Error('Forbidden')
    error.statusCode = 403
    throw error
  }
  const updatedConversation = await Conversation.findByIdAndUpdate(
    conversationId,
    { $addToSet: { members: memberId } },
    { new: true }
  )
  emitToUsers(updatedConversation.members.map(String), 'group:updated', { conversationId, group })
  await createNotification({
    userId: memberId,
    type: 'group_invite',
    fromUserId: userId,
    conversationId,
    message: 'Added to group'
  })
  return { conversationId, memberId }
}

export const removeMember = async ({ userId, conversationId, memberId }) => {
  const group = await ensureGroup(conversationId)
  await ensureMember(conversationId, userId)
  const removingSelf = String(userId) === String(memberId)
  if (!removingSelf) {
    ensureAdmin(group, userId)
  }
  const isRemovingAdmin = isAdmin(group, memberId)
  if (isRemovingAdmin && group.admins.length === 1) {
    const error = new Error('Assign another admin first')
    error.statusCode = 400
    throw error
  }
  const updatedConversation = await Conversation.findByIdAndUpdate(
    conversationId,
    { $pull: { members: memberId } },
    { new: true }
  )
  await Group.updateOne({ conversationId }, { $pull: { admins: memberId } })
  emitToUsers(updatedConversation.members.map(String), 'group:updated', { conversationId, group })
  return { conversationId, memberId }
}

export const makeAdmin = async ({ userId, conversationId, memberId }) => {
  const group = await ensureGroup(conversationId)
  await ensureMember(conversationId, userId)
  ensureAdmin(group, userId)
  await Group.updateOne({ conversationId }, { $addToSet: { admins: memberId } })
  const updated = await Group.findOne({ conversationId })
  const conversation = await Conversation.findById(conversationId)
  emitToUsers(conversation.members.map(String), 'group:updated', { conversationId, group: updated })
  return updated
}

export const updateGroup = async ({
  userId,
  conversationId,
  name,
  groupPic,
  onlyAdminsCanSend,
  onlyAdminsCanEdit,
  onlyAdminsCanAdd
}) => {
  const group = await ensureGroup(conversationId)
  const conversation = await ensureMember(conversationId, userId)
  const updatingPermissions =
    onlyAdminsCanSend !== undefined ||
    onlyAdminsCanEdit !== undefined ||
    onlyAdminsCanAdd !== undefined
  if (updatingPermissions && !isAdmin(group, userId)) {
    const error = new Error('Forbidden')
    error.statusCode = 403
    throw error
  }
  if (group.onlyAdminsCanEdit && (name !== undefined || groupPic !== undefined)) {
    ensureAdmin(group, userId)
  }
  const updates = {}
  if (name !== undefined) updates.name = name
  if (groupPic !== undefined) updates.groupPic = groupPic
  if (onlyAdminsCanSend !== undefined) updates.onlyAdminsCanSend = onlyAdminsCanSend
  if (onlyAdminsCanEdit !== undefined) updates.onlyAdminsCanEdit = onlyAdminsCanEdit
  if (onlyAdminsCanAdd !== undefined) updates.onlyAdminsCanAdd = onlyAdminsCanAdd
  const updated = await Group.findOneAndUpdate({ conversationId }, updates, { new: true })
  emitToUsers(conversation.members.map(String), 'group:updated', { conversationId, group: updated })
  return updated
}
