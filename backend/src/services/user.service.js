import User from '../models/User.js'
import Message from '../models/Message.js'
import Report from '../models/Report.js'

const sanitize = (user) => {
  const obj = user.toObject()
  delete obj.passwordHash
  return obj
}

export const getById = async (id) => {
  const user = await User.findById(id)
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }
  return sanitize(user)
}

export const getMe = async (id) => {
  const user = await User.findById(id)
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }
  return sanitize(user)
}

export const searchUsers = async (query, userId) => {
  if (!query) return []
  const regex = new RegExp(query, 'i')
  const users = await User.find({
    _id: { $ne: userId },
    $or: [{ name: regex }, { email: regex }]
  }).limit(20)
  return users.map(sanitize)
}

export const updateProfile = async (userId, { name, bio, profilePic }) => {
  const updates = {}
  if (name !== undefined) updates.name = name
  if (bio !== undefined) updates.bio = bio
  if (profilePic !== undefined) updates.profilePic = profilePic
  const user = await User.findByIdAndUpdate(userId, updates, { new: true })
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }
  return sanitize(user)
}

export const blockUser = async (userId, targetId) => {
  if (String(userId) === String(targetId)) {
    const error = new Error('Cannot block yourself')
    error.statusCode = 400
    throw error
  }
  await User.updateOne({ _id: userId }, { $addToSet: { blockedUsers: targetId } })
  await User.updateOne(
    { _id: userId },
    {
      $pull: {
        friends: targetId,
        friendRequestsSent: targetId,
        friendRequestsReceived: targetId
      }
    }
  )
  await User.updateOne(
    { _id: targetId },
    {
      $pull: {
        friends: userId,
        friendRequestsSent: userId,
        friendRequestsReceived: userId
      }
    }
  )
  return { blockedUserId: targetId }
}

export const reportUser = async (userId, targetId, reason = '') => {
  const report = await Report.create({
    reporterUserId: userId,
    reportedUserId: targetId,
    reason
  })
  return report
}

/* ── Star / Unstar Messages ── */
export const starMessage = async (userId, messageId) => {
  const message = await Message.findById(messageId)
  if (!message) {
    const error = new Error('Message not found')
    error.statusCode = 404
    throw error
  }
  await User.updateOne({ _id: userId }, { $addToSet: { starredMessages: messageId } })
  return { messageId }
}

export const unstarMessage = async (userId, messageId) => {
  await User.updateOne({ _id: userId }, { $pull: { starredMessages: messageId } })
  return { messageId }
}

export const getStarredMessages = async (userId) => {
  const user = await User.findById(userId).populate({
    path: 'starredMessages',
    populate: { path: 'senderId', select: 'name profilePic' }
  })
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }
  return user.starredMessages || []
}

/* ── Status Privacy ── */
export const updateStatusPrivacy = async (userId, { privacy, allowedUsers, excludedUsers }) => {
  const updates = {}
  if (privacy) updates.statusPrivacy = privacy
  if (allowedUsers !== undefined) updates.statusAllowedUsers = allowedUsers
  if (excludedUsers !== undefined) updates.statusExcludedUsers = excludedUsers
  const user = await User.findByIdAndUpdate(userId, updates, { new: true })
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }
  return sanitize(user)
}

/* ── E2EE Public Key ── */
export const updatePublicKey = async (userId, publicKey) => {
  const user = await User.findByIdAndUpdate(userId, { publicKey }, { new: true })
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }
  return { publicKey: user.publicKey }
}

export const getPublicKeys = async (userIds) => {
  const users = await User.find({ _id: { $in: userIds } }).select('_id publicKey name')
  return users.map((u) => ({ _id: u._id, name: u.name, publicKey: u.publicKey }))
}
