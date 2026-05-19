import multer from 'multer'
import path from 'path'
import fs from 'fs'
import env from '../config/env.js'

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = env.uploadDir
    ensureDir(dir)
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    cb(null, name)
  }
})

export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }
})
