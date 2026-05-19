import mongoose from 'mongoose'

const { Schema } = mongoose

const conversationSchema = new Schema(
  {
    isGroup: { type: Boolean, default: false },
    members: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessageId: { type: Schema.Types.ObjectId, ref: 'Message', default: null },

    /* Broadcast list support */
    isBroadcast: { type: Boolean, default: false },
    broadcastCreator: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    /* Disappearing messages — timer in seconds (0 = off) */
    disappearingTimer: { type: Number, default: 0 },

    /* Pinned messages */
    pinnedMessages: [{ type: Schema.Types.ObjectId, ref: 'Message' }]
  },
  { timestamps: true }
)

conversationSchema.index({ members: 1 })

export default mongoose.model('Conversation', conversationSchema)
