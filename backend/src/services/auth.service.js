import User from '../models/User.js'
import RefreshToken from '../models/RefreshToken.js'
import env from '../config/env.js'
import { hashPassword, comparePassword } from '../utils/hash.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js'

const durationToMs = (value) => {
  if (typeof value === 'number') return value
  const match = String(value).match(/^([0-9]+)([smhd])$/)
  if (!match) return 0
  const amount = Number(match[1])
  const unit = match[2]
  if (unit === 's') return amount * 1000
  if (unit === 'm') return amount * 60 * 1000
  if (unit === 'h') return amount * 60 * 60 * 1000
  return amount * 24 * 60 * 60 * 1000
}

const sanitizeUser = (user) => {
  const obj = user.toObject()
  delete obj.passwordHash
  return obj
}

const createTokens = async (userId, deviceName = 'Unknown Device') => {
  const accessToken = signAccessToken({ userId })
  const refreshToken = signRefreshToken({ userId })
  const expiresAt = new Date(Date.now() + durationToMs(env.refreshExpires))
  await RefreshToken.create({
    userId,
    token: refreshToken,
    expiresAt,
    deviceName,
    lastActiveAt: new Date()
  })
  return { accessToken, refreshToken, refreshExpiresAt: expiresAt }
}

export const register = async ({ name, email, password, deviceName }) => {
  const existing = await User.findOne({ email })
  if (existing) {
    const error = new Error('Email already in use')
    error.statusCode = 409
    throw error
  }
  const passwordHash = await hashPassword(password)
  const user = await User.create({ name, email, passwordHash })
  const tokens = await createTokens(user._id, deviceName)
  return { user: sanitizeUser(user), tokens }
}

export const login = async ({ email, password, deviceName }) => {
  const user = await User.findOne({ email })
  if (!user) {
    const error = new Error('Invalid credentials')
    error.statusCode = 401
    throw error
  }
  const match = await comparePassword(password, user.passwordHash)
  if (!match) {
    const error = new Error('Invalid credentials')
    error.statusCode = 401
    throw error
  }
  const tokens = await createTokens(user._id, deviceName)
  return { user: sanitizeUser(user), tokens }
}

export const refresh = async (token) => {
  if (!token) {
    const error = new Error('Refresh token missing')
    error.statusCode = 401
    throw error
  }
  let payload
  try {
    payload = verifyRefreshToken(token)
  } catch {
    const error = new Error('Invalid refresh token')
    error.statusCode = 401
    throw error
  }
  const stored = await RefreshToken.findOne({ token })
  if (!stored) {
    const error = new Error('Refresh token not found')
    error.statusCode = 401
    throw error
  }
  const deviceName = stored.deviceName || 'Unknown Device'
  await RefreshToken.deleteOne({ token })
  const tokens = await createTokens(payload.userId, deviceName)
  return { userId: payload.userId, tokens }
}

export const logout = async (token) => {
  if (!token) return
  await RefreshToken.deleteOne({ token })
}

export const logoutAll = async (userId) => {
  await RefreshToken.deleteMany({ userId })
}

/* ── Multi-Device Session Management ── */
export const getDevices = async (userId) => {
  const tokens = await RefreshToken.find({ userId })
    .select('_id deviceName lastActiveAt createdAt')
    .sort({ lastActiveAt: -1 })
  return tokens
}

export const revokeDevice = async (userId, tokenId) => {
  const token = await RefreshToken.findById(tokenId)
  if (!token) {
    const error = new Error('Session not found')
    error.statusCode = 404
    throw error
  }
  if (String(token.userId) !== String(userId)) {
    const error = new Error('Forbidden')
    error.statusCode = 403
    throw error
  }
  await RefreshToken.deleteOne({ _id: tokenId })
  return { revoked: tokenId }
}
