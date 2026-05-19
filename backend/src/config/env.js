import dotenv from 'dotenv'

dotenv.config()

const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI,
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  uploadDir: process.env.UPLOAD_DIR || 'uploads'
}

export default env
