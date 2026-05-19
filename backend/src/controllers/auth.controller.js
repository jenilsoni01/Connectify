import { z } from 'zod'
import env from '../config/env.js'
import { COOKIE_NAME } from '../utils/constants.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ok } from '../utils/apiResponse.js'
import { register, login, refresh, logout, logoutAll, getDevices, revokeDevice } from '../services/auth.service.js'
import { getMe } from '../services/user.service.js'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

const cookieOptions = (expiresAt) => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: 'lax',
  expires: expiresAt
})

const clearCookieOptions = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: 'lax'
}

const getRefreshToken = (req) => req.cookies?.[COOKIE_NAME]

const getDeviceName = (req) => {
  const ua = req.headers['user-agent'] || 'Unknown Device'
  return ua.substring(0, 120)
}

export const registerController = asyncHandler(async (req, res) => {
  const body = registerSchema.parse(req.body)
  const result = await register({ ...body, deviceName: getDeviceName(req) })
  res.cookie(COOKIE_NAME, result.tokens.refreshToken, cookieOptions(result.tokens.refreshExpiresAt))
  return ok(res, 'Registered', { user: result.user, accessToken: result.tokens.accessToken })
})

export const loginController = asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body)
  const result = await login({ ...body, deviceName: getDeviceName(req) })
  res.cookie(COOKIE_NAME, result.tokens.refreshToken, cookieOptions(result.tokens.refreshExpiresAt))
  return ok(res, 'Logged in', { user: result.user, accessToken: result.tokens.accessToken })
})

export const refreshController = asyncHandler(async (req, res) => {
  const token = getRefreshToken(req)
  const result = await refresh(token)
  res.cookie(COOKIE_NAME, result.tokens.refreshToken, cookieOptions(result.tokens.refreshExpiresAt))
  return ok(res, 'Token refreshed', { accessToken: result.tokens.accessToken })
})

export const logoutController = asyncHandler(async (req, res) => {
  const token = getRefreshToken(req)
  await logout(token)
  res.clearCookie(COOKIE_NAME, clearCookieOptions)
  return ok(res, 'Logged out')
})

export const logoutAllController = asyncHandler(async (req, res) => {
  await logoutAll(req.user.id)
  res.clearCookie(COOKIE_NAME, clearCookieOptions)
  return ok(res, 'Logged out from all devices')
})

export const meController = asyncHandler(async (req, res) => {
  const user = await getMe(req.user.id)
  return ok(res, 'Me', user)
})

/* ── Multi-Device Session Management ── */
export const getDevicesController = asyncHandler(async (req, res) => {
  const devices = await getDevices(req.user.id)
  return ok(res, 'Devices', devices)
})

export const revokeDeviceController = asyncHandler(async (req, res) => {
  const result = await revokeDevice(req.user.id, req.params.tokenId)
  return ok(res, 'Device revoked', result)
})
