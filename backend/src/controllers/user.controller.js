import { z } from 'zod'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ok } from '../utils/apiResponse.js'
import {
  getById,
  searchUsers,
  updateProfile,
  blockUser,
  reportUser,
  starMessage,
  unstarMessage,
  getStarredMessages,
  updateStatusPrivacy,
  updatePublicKey,
  getPublicKeys
} from '../services/user.service.js'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(280).optional(),
  profilePic: z.string().optional()
})

const reportSchema = z.object({
  reason: z.string().max(500).optional()
})

const statusPrivacySchema = z.object({
  privacy: z.enum(['everyone', 'contacts', 'nobody', 'custom']),
  allowedUsers: z.array(z.string()).optional(),
  excludedUsers: z.array(z.string()).optional()
})

const publicKeySchema = z.object({
  publicKey: z.string().min(1)
})

const publicKeysSchema = z.object({
  userIds: z.array(z.string()).min(1)
})

export const searchUsersController = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '')
  const users = await searchUsers(q, req.user.id)
  return ok(res, 'Users', users)
})

export const getUserController = asyncHandler(async (req, res) => {
  const user = await getById(req.params.id)
  return ok(res, 'User', user)
})

export const updateUserController = asyncHandler(async (req, res) => {
  const body = updateSchema.parse(req.body)
  const user = await updateProfile(req.user.id, body)
  return ok(res, 'Profile updated', user)
})

export const blockUserController = asyncHandler(async (req, res) => {
  const result = await blockUser(req.user.id, req.params.id)
  return ok(res, 'User blocked', result)
})

export const reportUserController = asyncHandler(async (req, res) => {
  const body = reportSchema.parse(req.body)
  const report = await reportUser(req.user.id, req.params.id, body.reason)
  return ok(res, 'User reported', report)
})

export const starMessageController = asyncHandler(async (req, res) => {
  const result = await starMessage(req.user.id, req.params.messageId)
  return ok(res, 'Message starred', result)
})

export const unstarMessageController = asyncHandler(async (req, res) => {
  const result = await unstarMessage(req.user.id, req.params.messageId)
  return ok(res, 'Message unstarred', result)
})

export const getStarredController = asyncHandler(async (req, res) => {
  const messages = await getStarredMessages(req.user.id)
  return ok(res, 'Starred messages', messages)
})

export const updateStatusPrivacyController = asyncHandler(async (req, res) => {
  const body = statusPrivacySchema.parse(req.body)
  const user = await updateStatusPrivacy(req.user.id, body)
  return ok(res, 'Status privacy updated', user)
})

export const updatePublicKeyController = asyncHandler(async (req, res) => {
  const body = publicKeySchema.parse(req.body)
  const result = await updatePublicKey(req.user.id, body.publicKey)
  return ok(res, 'Public key updated', result)
})

export const getPublicKeysController = asyncHandler(async (req, res) => {
  const body = publicKeysSchema.parse(req.body)
  const keys = await getPublicKeys(body.userIds)
  return ok(res, 'Public keys', keys)
})
