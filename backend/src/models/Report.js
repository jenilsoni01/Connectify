import mongoose from 'mongoose'

const { Schema } = mongoose

const reportSchema = new Schema(
  {
    reportedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reporterUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, default: '' }
  },
  { timestamps: true }
)

export default mongoose.model('Report', reportSchema)
