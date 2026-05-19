import mongoose from 'mongoose'

const { Schema } = mongoose

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    bio: { type: String, default: '' },
    profilePic: { type: String, default: '' },
    friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    friendRequestsReceived: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    friendRequestsSent: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastSeen: { type: Date, default: null },
    isOnline: { type: Boolean, default: false },

    /* Starred messages */
    starredMessages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],

    /* Status / Story privacy */
    statusPrivacy: {
      type: String,
      enum: ['everyone', 'contacts', 'nobody', 'custom'],
      default: 'everyone'
    },
    statusAllowedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    statusExcludedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    /* E2E Encryption — public key (PEM) */
    publicKey: { type: String, default: '' }
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
