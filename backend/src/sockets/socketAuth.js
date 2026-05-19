import { verifyAccessToken } from '../utils/jwt.js'

export const socketAuth = (token) => {
  if (!token) return null
  try {
    const payload = verifyAccessToken(token)
    return payload.userId
  } catch {
    return null
  }
}
