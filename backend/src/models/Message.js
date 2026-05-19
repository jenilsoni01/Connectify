import mongoose from 'mongoose'

const { Schema } = mongoose

const reactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true }
  },
  { _id: false }
)

const editEntrySchema = new Schema(
  {
    content: { type: String, default: '' },
    editedAt: { type: Date, default: Date.now }
  },
  { _id: false }
)

const messageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, default: '' },
    type: { type: String, enum: ['text', 'image', 'file', 'audio'], default: 'text' },
    fileUrl: { type: String, default: '' },
    deliveredTo: [{ userId: { type: Schema.Types.ObjectId, ref: 'User' }, at: { type: Date, default: Date.now } }],
    readBy: [{ userId: { type: Schema.Types.ObjectId, ref: 'User' }, at: { type: Date, default: Date.now } }],
    reactions: [reactionSchema],
    isDeleted: { type: Boolean, default: false },

    /* Replies & Forwarding */
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    forwardedFrom: { type: Schema.Types.ObjectId, ref: 'Message', default: null },

    /* Message editing */
    isEdited: { type: Boolean, default: false },
    editHistory: [editEntrySchema],

    /* Pin */
    isPinned: { type: Boolean, default: false },

    /* Disappearing messages — TTL handled by Mongo index */
    expiresAt: { type: Date, default: null },

    /* E2E Encryption */
    encryptedContent: { type: String, default: '' },
    encryptedKeys: { type: Map, of: String, default: {} }
  },
  { timestamps: true }
)

messageSchema.index({ conversationId: 1, createdAt: -1 })
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $exists: true, $ne: null } } })

export default mongoose.model('Message', messageSchema)
