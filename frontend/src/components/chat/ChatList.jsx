import { formatRelative } from '../../utils/formatTime.js'

const getTitle = (conversation, userId) => {
  if (conversation.isBroadcast) {
    const count = (conversation.members || []).filter((m) => String(m._id || m) !== String(userId)).length
    return `📢 Broadcast (${count} recp.)`
  }
  if (conversation.isGroup) return conversation.group?.name || 'Group'
  const other = conversation.members.find((m) => String(m._id || m) !== String(userId))
  return other?.name || 'Chat'
}

const getAvatar = (conversation, userId) => {
  if (conversation.isGroup) return conversation.group?.groupPic
  const other = conversation.members.find((m) => String(m._id || m) !== String(userId))
  return other?.profilePic
}

const isOtherOnline = (conversation, userId) => {
  if (conversation.isGroup || conversation.isBroadcast) return false
  const other = conversation.members?.find((m) => String(m._id || m) !== String(userId))
  return other?.isOnline || false
}

const ChatList = ({ conversations, activeId, onSelect, userId }) => {
  return (
    <div className="flex flex-col gap-3">
      {conversations.map((conversation) => {
        const last = conversation.lastMessageId
        return (
          <button
            key={conversation._id}
            onClick={() => onSelect(conversation)}
            className={`flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-left transition ${
              activeId === conversation._id
                ? 'border-black/20 bg-black/5'
                : 'bg-white/70 hover:bg-white'
            }`}
          >
            <div className="relative h-10 w-10 shrink-0 rounded-full bg-black/10">
              {getAvatar(conversation, userId) ? (
                <img
                  src={getAvatar(conversation, userId)}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : null}
              {isOtherOnline(conversation, userId) ? (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" title="Online" />
              ) : null}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  {getTitle(conversation, userId)}
                  {conversation.disappearingTimer > 0 ? (
                    <span className="text-[10px] opacity-50" title="Disappearing messages on">⏱</span>
                  ) : null}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {last?.createdAt ? formatRelative(last.createdAt) : ''}
                </p>
              </div>
              <p className="truncate text-xs text-[var(--muted)]">
                {last?.isDeleted 
                  ? 'Message deleted' 
                  : last?.type === 'image' 
                  ? '📷 Image' 
                  : last?.type === 'audio' 
                  ? '🎵 Voice note' 
                  : last?.type === 'file' 
                  ? '📁 File' 
                  : last?.content || 'No messages yet'}
              </p>
            </div>
            {conversation.unreadCount > 0 ? (
              <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs text-white">
                {conversation.unreadCount}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export default ChatList
