import jwt from 'jsonwebtoken'
import env from '../config/env.js'

export const signAccessToken = (payload) => {
  return jwt.sign(payload, env.accessSecret, { expiresIn: env.accessExpires })
}

export const signRefreshToken = (payload) => {
  return jwt.sign(payload, env.refreshSecret, { expiresIn: env.refreshExpires })
}

export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.accessSecret)
}

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.refreshSecret)
}
