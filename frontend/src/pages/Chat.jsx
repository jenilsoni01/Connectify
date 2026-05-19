import { useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useSocket } from '../hooks/useSocket.js'
import * as chatApi from '../api/chat.api.js'
import * as userApi from '../api/user.api.js'
import * as friendApi from '../api/friend.api.js'
import * as broadcastApi from '../api/broadcast.api.js'
import { uploadChat } from '../api/upload.api.js'
import { encryptMessage, decryptMessage } from '../utils/crypto.js'
import ChatList from '../components/chat/ChatList.jsx'
import ChatWindow from '../components/chat/ChatWindow.jsx'
import Loader from '../components/common/Loader.jsx'
import CreateGroupModal from '../components/group/CreateGroupModal.jsx'
import CreateBroadcastModal from '../components/group/CreateBroadcastModal.jsx'

const Chat = () => {
  const { user, privateKey } = useAuth()
  const { socket } = useSocket()
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [typingLabel, setTypingLabel] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [editingMessage, setEditingMessage] = useState(null)
  const [pinnedMessages, setPinnedMessages] = useState([])
  const [friends, setFriends] = useState([])
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)

  const decryptSingleMessage = useCallback(async (msg) => {
    if (msg?.encryptedContent && msg?.encryptedKeys && privateKey) {
      try {
        let myKey = msg.encryptedKeys[user?._id] || msg.encryptedKeys[user?.id]
        if (!myKey && typeof msg.encryptedKeys.get === 'function') {
          myKey = msg.encryptedKeys.get(user?._id) || msg.encryptedKeys.get(user?.id)
        }
        if (!myKey) {
          const keysObj = msg.encryptedKeys instanceof Map 
            ? Object.fromEntries(msg.encryptedKeys) 
            : msg.encryptedKeys
          myKey = keysObj?.[user?._id] || keysObj?.[user?.id]
        }
        if (myKey) {
          const decrypted = await decryptMessage(msg.encryptedContent, myKey, privateKey)
          
          let decryptedHistory = []
          if (msg.editHistory && msg.editHistory.length > 0) {
             decryptedHistory = await Promise.all(msg.editHistory.map(async (entry) => {
               try {
                 // Try decrypting the history entry. (It was pushed as encryptedContent)
                 const decEntry = await decryptMessage(entry.content, myKey, privateKey)
                 return { ...entry, content: decEntry }
               } catch (e) {
                 return entry // fallback
               }
             }))
          }
          
          return { ...msg, content: decrypted, editHistory: msg.editHistory ? decryptedHistory : [] }
        }
      } catch (err) {
        console.error('Failed to decrypt message', err)
        return msg
      }
    }
    return msg
  }, [privateKey, user?._id])

  const loadConversations = async () => {
    setLoading(true)
    try {
      const [res, friendsRes] = await Promise.all([
        chatApi.getMyConversations(),
        friendApi.listFriends()
      ])
      const decryptedList = await Promise.all(res.map(async (c) => {
        if (c.lastMessageId) {
          c.lastMessageId = await decryptSingleMessage(c.lastMessageId)
        }
        return c
      }))
      setConversations(decryptedList)
      setFriends(friendsRes || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId) => {
    const res = await chatApi.getMessages(conversationId)
    const list = await Promise.all(res.map(async (m) => {
      const decrypted = await decryptSingleMessage(m)
      return {
        ...decrypted,
        isMine: String(m.senderId?._id || m.senderId) === String(user._id)
      }
    }))
    setMessages(list)
    setConversations((prev) =>
      prev.map((c) => (c._id === conversationId ? { ...c, unreadCount: 0 } : c))
    )
    await chatApi.markRead(conversationId)
    socket?.emit('message:read', { conversationId })
    socket?.emit('message:delivered', { conversationId })
  }

  const loadPinned = async (conversationId) => {
    try {
      const res = await chatApi.getPinnedMessages(conversationId)
      const list = await Promise.all(res.map(decryptSingleMessage))
      setPinnedMessages(list)
    } catch {
      setPinnedMessages([])
    }
  }

  useEffect(() => {
    loadConversations()
  }, [decryptSingleMessage])

  useEffect(() => {
    if (!active) return
    loadMessages(active._id)
    loadPinned(active._id)
  }, [active?._id, decryptSingleMessage])

  useEffect(() => {
    if (!socket) return
    const onMessage = async (message) => {
      const decrypted = await decryptSingleMessage(message)
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === message.conversationId) {
            const isCurrentActive = active?._id === message.conversationId
            const isMine = String(message.senderId?._id || message.senderId) === String(user._id)
            return {
              ...c,
              lastMessageId: decrypted,
              unreadCount: isCurrentActive ? 0 : isMine ? (c.unreadCount || 0) : (c.unreadCount || 0) + 1
            }
          }
          return c
        })
      )
      if (active?._id === message.conversationId) {
        setMessages((prev) => [
          ...prev,
          { ...decrypted, isMine: String(message.senderId?._id || message.senderId) === String(user._id) }
        ])
        chatApi.markRead(message.conversationId)
      }
    }
    const onTyping = (payload) => {
      if (active?._id !== payload.conversationId) return
      setTypingLabel(payload.isTyping ? 'Someone' : '')
    }
    const onMessageUpdated = async (message) => {
      const decrypted = await decryptSingleMessage(message)
      setMessages((prev) =>
        prev.map((m) =>
          m._id === message._id
            ? { ...decrypted, isMine: String(message.senderId?._id || message.senderId) === String(user._id) }
            : m
        )
      )
      setConversations((prev) =>
        prev.map((c) =>
          c.lastMessageId?._id === message._id ? { ...c, lastMessageId: decrypted } : c
        )
      )
    }
    const onPinned = (payload) => {
      if (active?._id === payload.conversationId) {
        loadPinned(payload.conversationId)
      }
    }
    const onReadUpdate = ({ conversationId, userId }) => {
      if (active?._id !== conversationId) return
      setMessages((prev) =>
        prev.map((m) => {
          const alreadyRead = m.readBy?.some((r) => String(r.userId?._id || r.userId) === String(userId))
          if (!alreadyRead) {
            return {
              ...m,
              readBy: [...(m.readBy || []), { userId, at: new Date() }]
            }
          }
          return m
        })
      )
    }
    const onDeliveredUpdate = ({ conversationId, userId }) => {
      if (active?._id !== conversationId) return
      setMessages((prev) =>
        prev.map((m) => {
          const alreadyDelivered = m.deliveredTo?.some((d) => String(d.userId?._id || d.userId) === String(userId))
          if (!alreadyDelivered) {
            return {
              ...m,
              deliveredTo: [...(m.deliveredTo || []), { userId, at: new Date() }]
            }
          }
          return m
        })
      )
    }
    const onUserStatus = ({ userId: statusUserId, isOnline, lastSeen }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.members?.some((m) => String(m._id || m) === String(statusUserId))) {
            return {
              ...c,
              members: c.members.map((m) =>
                String(m._id || m) === String(statusUserId)
                  ? { ...m, isOnline, lastSeen }
                  : m
              )
            }
          }
          return c
        })
      )
      setActive((prev) => {
        if (!prev) return prev
        const isMember = prev.members?.some((m) => String(m._id || m) === String(statusUserId))
        if (!isMember) return prev
        return {
          ...prev,
          members: prev.members.map((m) =>
            String(m._id || m) === String(statusUserId)
              ? { ...m, isOnline, lastSeen }
              : m
          )
        }
      })
    }
    socket.on('message:new', onMessage)
    socket.on('message:typing', onTyping)
    socket.on('message:updated', onMessageUpdated)
    socket.on('message:pinned', onPinned)
    socket.on('message:readUpdate', onReadUpdate)
    socket.on('message:deliveredUpdate', onDeliveredUpdate)
    socket.on('user:status', onUserStatus)
    return () => {
      socket.off('message:new', onMessage)
      socket.off('message:typing', onTyping)
      socket.off('message:updated', onMessageUpdated)
      socket.off('message:pinned', onPinned)
      socket.off('message:readUpdate', onReadUpdate)
      socket.off('message:deliveredUpdate', onDeliveredUpdate)
      socket.off('user:status', onUserStatus)
    }
  }, [socket, active?._id, user?._id, decryptSingleMessage])

  const getConversationKeys = async (conversation) => {
    const memberIds = conversation.members.map((m) => String(m._id || m))
    try {
      const keys = await userApi.getPublicKeys(memberIds)
      const keyMap = {}
      keys.forEach((k) => {
        if (k.publicKey) keyMap[k._id] = k.publicKey
      })
      if (Object.keys(keyMap).length > 0) return keyMap
    } catch (err) {
      console.error('Failed to get public keys', err)
    }
    return null
  }

  const handleSend = async ({ content, file, type, replyTo: replyToId }) => {
    if (!active) return
    let payload = { content, replyTo: replyToId || undefined }
    if (file) {
      const uploadRes = await uploadChat(file)
      const url = uploadRes.url
      const fileType = type || (file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'file')
      payload = { content: content || '', fileUrl: url, type: fileType, replyTo: replyToId || undefined }
    }
    
    // E2EE Encryption
    if (payload.content) {
      const keyMap = await getConversationKeys(active)
      if (keyMap && Object.keys(keyMap).length > 0) {
        const { encryptedContent, encryptedKeys } = await encryptMessage(payload.content, keyMap)
        payload.encryptedContent = encryptedContent
        payload.encryptedKeys = encryptedKeys
        payload.content = '' // hide plaintext
      }
    }

    if (active.isBroadcast) {
      await broadcastApi.sendBroadcast(active._id, payload)
    } else {
      await chatApi.sendMessage(active._id, payload)
    }
    setReplyTo(null)
  }

  const handleReact = async (messageId, emoji) => {
    const updated = await chatApi.reactMessage(messageId, emoji)
    setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, reactions: updated.reactions } : m)))
  }

  const handleDelete = async (messageId) => {
    const ok = window.confirm('Delete this message?')
    if (!ok) return
    await chatApi.deleteMessage(messageId)
    setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, isDeleted: true } : m)))
  }

  const handleEdit = async (messageIdOrMsg, newContent) => {
    if (typeof messageIdOrMsg === 'object') {
      setEditingMessage(messageIdOrMsg)
      return
    }
    
    let payload = { content: newContent }
    // Encrypt edit if conversation supports it
    const keyMap = await getConversationKeys(active)
    if (keyMap && Object.keys(keyMap).length > 0) {
      const { encryptedContent, encryptedKeys } = await encryptMessage(newContent, keyMap)
      payload = { content: '', encryptedContent, encryptedKeys }
    }

    const updated = await chatApi.editMessage(messageIdOrMsg, payload)
    const decrypted = await decryptSingleMessage(updated)
    setMessages((prev) =>
      prev.map((m) =>
        m._id === messageIdOrMsg
          ? { ...decrypted, isMine: true }
          : m
      )
    )
    setEditingMessage(null)
  }

  const handleForward = async (messageId, targetConversationId) => {
    if (!messages.some((m) => m._id === messageId)) return
    if (!conversations.some((c) => c._id === targetConversationId)) return
    await chatApi.forwardMessage(messageId, targetConversationId)
  }

  const handlePin = async (messageId) => {
    await chatApi.pinMessage(messageId)
    if (active) loadPinned(active._id)
  }

  const handleStar = async (messageId) => {
    await userApi.starMessage(messageId)
  }

  const handleReply = (message) => {
    setReplyTo(message)
    setEditingMessage(null)
  }

  const handleTyping = (isTyping) => {
    if (!active) return
    socket?.emit('message:typing', { conversationId: active._id, isTyping })
  }

  const handleClearChat = async () => {
    if (!active) return
    try {
      await chatApi.clearConversation(active._id)
      setMessages([])
      setConversations((prev) =>
        prev.map((c) => (c._id === active._id ? { ...c, lastMessageId: null } : c))
      )
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteChat = async () => {
    if (!active) return
    try {
      await chatApi.deleteConversation(active._id)
      setConversations((prev) => prev.filter((c) => c._id !== active._id))
      setActive(null)
      setMessages([])
    } catch (err) {
      console.error(err)
    }
  }

  const handleLeaveGroup = async () => {
    if (!active) return
    try {
      await chatApi.removeGroupMember({ conversationId: active._id, memberId: user._id })
      const updated = await chatApi.getConversation(active._id)
      setActive(updated)
      setConversations((prev) =>
        prev.map((c) => (c._id === active._id ? updated : c))
      )
    } catch (err) {
      console.error(err)
    }
  }

  const handleSetDisappearing = async (timer) => {
    if (!active) return
    try {
      const updated = await chatApi.setDisappearing(active._id, timer)
      setActive(updated)
      setConversations((prev) =>
        prev.map((c) => (c._id === active._id ? { ...c, disappearingTimer: timer } : c))
      )
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateGroup = async (payload) => {
    try {
      await chatApi.createGroup(payload)
      setShowGroupModal(false)
      loadConversations()
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateBroadcast = async (payload) => {
    try {
      await broadcastApi.createBroadcast(payload)
      setShowBroadcastModal(false)
      loadConversations()
    } catch (err) {
      console.error(err)
    }
  }

  const list = useMemo(() => conversations, [conversations])
  const canSend =
    !active?.isGroup ||
    !active?.group?.onlyAdminsCanSend ||
    active?.group?.admins?.some((id) => String(id) === String(user?._id))

  if (loading) return <Loader />

  return (
    <div className="grid h-full gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chats</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGroupModal(true)}
              className="rounded-xl bg-black/5 px-2.5 py-1.5 text-xs font-semibold hover:bg-black/10 transition"
              title="Create Group"
            >
              👥 +Group
            </button>
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="rounded-xl bg-black/5 px-2.5 py-1.5 text-xs font-semibold hover:bg-black/10 transition"
              title="Create Broadcast"
            >
              📢 +Broadcast
            </button>
          </div>
        </div>
        {list.length === 0 ? (
          <div className="rounded-2xl bg-white/70 p-6 text-center text-xs text-[var(--muted)]">
            No active chats yet. Go to "Friends" to message a friend, or use "+Group" / "+Broadcast" above!
          </div>
        ) : (
          <ChatList
            conversations={list}
            activeId={active?._id}
            onSelect={setActive}
            userId={user?._id}
          />
        )}
      </div>
      <ChatWindow
        conversation={active}
        messages={messages}
        conversations={conversations}
        pinnedMessages={pinnedMessages}
        onSend={handleSend}
        onReact={handleReact}
        onDelete={handleDelete}
        onTyping={handleTyping}
        onReply={handleReply}
        onForward={handleForward}
        onEdit={handleEdit}
        onPin={handlePin}
        onStar={handleStar}
        typingLabel={typingLabel}
        canSend={canSend}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => { setEditingMessage(null) }}
        userId={user?._id}
        onClearChat={handleClearChat}
        onDeleteChat={handleDeleteChat}
        onLeaveGroup={handleLeaveGroup}
        onSetDisappearing={handleSetDisappearing}
      />

      {showGroupModal && (
        <CreateGroupModal
          open={showGroupModal}
          onClose={() => setShowGroupModal(false)}
          friends={friends}
          onCreate={handleCreateGroup}
        />
      )}

      {showBroadcastModal && (
        <CreateBroadcastModal
          open={showBroadcastModal}
          onClose={() => setShowBroadcastModal(false)}
          friends={friends}
          onCreate={handleCreateBroadcast}
        />
      )}
    </div>
  )
}

export default Chat
