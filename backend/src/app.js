import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import env from './config/env.js'
import { corsOptions } from './config/cors.js'
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import friendRoutes from './routes/friend.routes.js'
import conversationRoutes from './routes/conversation.routes.js'
import messageRoutes from './routes/message.routes.js'
import groupRoutes from './routes/group.routes.js'
import storyRoutes from './routes/story.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import uploadRoutes from './routes/upload.routes.js'
import broadcastRoutes from './routes/broadcast.routes.js'
import { errorHandler } from './middlewares/error.middleware.js'

const app = express()

app.use(helmet())
app.use(cors(corsOptions))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/uploads', express.static(path.resolve(env.uploadDir)))

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/friends', friendRoutes)
app.use('/api/v1/conversations', conversationRoutes)
app.use('/api/v1/messages', messageRoutes)
app.use('/api/v1/groups', groupRoutes)
app.use('/api/v1/stories', storyRoutes)
app.use('/api/v1/notifications', notificationRoutes)
app.use('/api/v1/upload', uploadRoutes)
app.use('/api/v1/broadcasts', broadcastRoutes)

app.use(errorHandler)

export default app
