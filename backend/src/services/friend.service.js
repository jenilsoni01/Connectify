import User from '../models/User.js'
import { createNotification } from './notification.service.js'

const ensureUser = async (id) => {
  const user = await User.findById(id)
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }
  return user
}

export const sendRequest = async (userId, targetId) => {
  if (String(userId) === String(targetId)) {
    const error = new Error('Cannot send request to yourself')
    error.statusCode = 400
    throw error
  }
  const [user, target] = await Promise.all([ensureUser(userId), ensureUser(targetId)])
  if (user.blockedUsers.includes(target._id) || target.blockedUsers.includes(user._id)) {
    const error = new Error('User is blocked')
    error.statusCode = 403
    throw error
  }
  if (user.friends.includes(target._id)) {
    const error = new Error('Already friends')
    error.statusCode = 400
    throw error
  }
  if (user.friendRequestsSent.includes(target._id)) {
    const error = new Error('Request already sent')
    error.statusCode = 400
    throw error
  }
  await User.updateOne({ _id: userId }, { $addToSet: { friendRequestsSent: targetId } })
  await User.updateOne({ _id: targetId }, { $addToSet: { friendRequestsReceived: userId } })
  await createNotification({
    userId: targetId,
    type: 'friend_request',
    fromUserId: userId,
    message: 'New friend request'
  })
  return { requestedUserId: targetId }
}

export const acceptRequest = async (userId, fromUserId) => {
  const user = await ensureUser(userId)
  if (!user.friendRequestsReceived.includes(fromUserId)) {
    const error = new Error('Request not found')
    error.statusCode = 404
    throw error
  }
  await User.updateOne(
    { _id: userId },
    {
      $pull: { friendRequestsReceived: fromUserId },
      $addToSet: { friends: fromUserId }
    }
  )
  await User.updateOne(
    { _id: fromUserId },
    {
      $pull: { friendRequestsSent: userId },
      $addToSet: { friends: userId }
    }
  )
  await createNotification({
    userId: fromUserId,
    type: 'friend_accept',
    fromUserId: userId,
    message: 'Friend request accepted'
  })
  return { friendId: fromUserId }
}

export const rejectRequest = async (userId, fromUserId) => {
  await User.updateOne(
    { _id: userId },
    {
      $pull: { friendRequestsReceived: fromUserId }
    }
  )
  await User.updateOne(
    { _id: fromUserId },
    {
      $pull: { friendRequestsSent: userId }
    }
  )
  return { rejectedUserId: fromUserId }
}

export const listFriends = async (userId) => {
  const user = await User.findById(userId).populate('friends', '-passwordHash')
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }
  return user.friends
}

export const listRequests = async (userId) => {
  const user = await User.findById(userId)
    .populate('friendRequestsReceived', '-passwordHash')
    .populate('friendRequestsSent', '-passwordHash')
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }
  return {
    received: user.friendRequestsReceived,
    sent: user.friendRequestsSent
  }
}
