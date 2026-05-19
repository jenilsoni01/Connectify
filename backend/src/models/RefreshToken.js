import mongoose from 'mongoose'

const { Schema } = mongoose

const refreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },

    /* Multi-device session info */
    deviceName: { type: String, default: 'Unknown Device' },
    lastActiveAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
)

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('RefreshToken', refreshTokenSchema)
