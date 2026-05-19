import { verifyAccessToken } from '../utils/jwt.js'

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    const error = new Error('Unauthorized')
    error.statusCode = 401
    throw error
  }
  try {
    const payload = verifyAccessToken(token)
    req.user = { id: payload.userId }
    next()
  } catch {
    const error = new Error('Unauthorized')
    error.statusCode = 401
    throw error
  }
}
