import mongoose from 'mongoose'

const { Schema } = mongoose

const storySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contentText: { type: String, default: '' },
    mediaUrl: { type: String, default: '' },
    viewers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
)

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('Story', storySchema)
