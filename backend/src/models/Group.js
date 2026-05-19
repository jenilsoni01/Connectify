import mongoose from 'mongoose'

const { Schema } = mongoose

const groupSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, unique: true },
    name: { type: String, required: true, trim: true },
    groupPic: { type: String, default: '' },
    onlyAdminsCanSend: { type: Boolean, default: false },
    onlyAdminsCanEdit: { type: Boolean, default: false },
    onlyAdminsCanAdd: { type: Boolean, default: false },
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
)

export default mongoose.model('Group', groupSchema)
