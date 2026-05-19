import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'
import env from '../config/env.js'
import { registerHandlers } from './handlers.js'
import { setSocketNamespace, addUserSocket, emitToUsers } from './socketStore.js'
import { socketAuth } from './socketAuth.js'
import User from '../models/User.js'

const markOnline = async (userId) => {
  await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() })
  const user = await User.findById(userId)
  if (!user) return
  emitToUsers(user.friends.map(String), 'user:status', {
    userId: String(userId),
    isOnline: true,
    lastSeen: user.lastSeen
  })
}

export const initSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: env.corsOrigin, credentials: true }
  })

  // Set up Redis Adapter if REDIS_URL is provided in env
  if (process.env.REDIS_URL) {
    const pubClient = createClient({ url: process.env.REDIS_URL })
    const subClient = pubClient.duplicate()
    
    pubClient.on('error', (err) => console.log('Redis Pub Error:', err))
    subClient.on('error', (err) => console.log('Redis Sub Error:', err))

    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
      io.adapter(createAdapter(pubClient, subClient))
      console.log('Redis Adapter initialized for Socket.IO')
    })
  }

  const chat = io.of('/chat')
  setSocketNamespace(chat)

  chat.use((socket, next) => {
    const header = socket.handshake.headers.authorization || ''
    const tokenFromHeader = header.startsWith('Bearer ') ? header.slice(7) : null
    const token = socket.handshake.auth?.token || tokenFromHeader
    const userId = socketAuth(token)
    if (userId) {
      socket.data.userId = userId
    }
    next()
  })

  chat.on('connection', async (socket) => {
    if (socket.data.userId) {
      addUserSocket(socket.data.userId, socket)
      await markOnline(socket.data.userId)
    }
    registerHandlers(socket)
  })

  return io
}
