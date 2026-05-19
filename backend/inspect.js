import mongoose from 'mongoose'
import Conversation from './src/models/Conversation.js'
import Message from './src/models/Message.js'
import dotenv from 'dotenv'

dotenv.config()

async function run() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to DB')
  
  const convs = await Conversation.find()
    .populate('lastMessageId')
    .limit(10)
  
  console.log('CONVERSATIONS METADATA:')
  for (const c of convs) {
    console.log({
      id: c._id,
      isGroup: c.isGroup,
      lastMessageId: c.lastMessageId ? {
        id: c.lastMessageId._id,
        content: c.lastMessageId.content,
        encryptedContent: c.lastMessageId.encryptedContent,
        encryptedKeys: c.lastMessageId.encryptedKeys
      } : null
    })
  }
  
  await mongoose.disconnect()
}

run().catch(console.error)
