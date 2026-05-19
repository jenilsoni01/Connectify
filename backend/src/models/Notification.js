import mongoose from 'mongoose'

const { Schema } = mongoose

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', default: null },
    storyId: { type: Schema.Types.ObjectId, ref: 'Story', default: null },
    message: { type: String, default: '' },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
)

export default mongoose.model('Notification', notificationSchema)
