import { formatTime } from '../../utils/formatTime.js'
import { useState } from 'react'

const QuotedMessage = ({ message }) => {
  if (!message) return null
  return (
    <div className="mb-2 rounded-lg border-l-4 border-[var(--accent)] bg-black/5 px-3 py-1.5 text-xs">
      <p className="font-semibold opacity-70">{message.senderId?.name || 'Unknown'}</p>
      <p className="truncate opacity-60">{message.content || '📎 Attachment'}</p>
    </div>
  )
}

const EditHistoryModal = ({ history, onClose }) => {
  if (!history || history.length === 0) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-80 rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-3 text-sm font-semibold">Edit History</h3>
        <div className="max-h-60 space-y-2 overflow-y-auto">
          {history.map((entry, i) => (
            <div key={i} className="rounded-lg bg-black/5 px-3 py-2 text-xs">
              <p>{entry.content}</p>
              <p className="mt-1 text-[10px] opacity-50">{new Date(entry.editedAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-3 w-full rounded-xl bg-black/10 py-2 text-xs font-semibold">
          Close
        </button>
      </div>
    </div>
  )
}

const MessageBubble = ({ message, isMe, onReply, onForward, onEdit, onPin, onStar, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  return (
    <>
      <div
        className={`group relative flex ${isMe ? 'justify-end' : 'justify-start'}`}
        onContextMenu={(e) => {
          e.preventDefault()
          setShowMenu(!showMenu)
        }}
      >
        <div
          className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
            isMe ? 'bg-[var(--accent)] text-white' : 'bg-white text-black'
          }`}
        >
          {/* Forwarded label */}
          {message.forwardedFrom ? (
            <p className="mb-1 text-[10px] italic opacity-60">↗ Forwarded</p>
          ) : null}

          {/* Quoted / replied message */}
          {message.replyTo ? <QuotedMessage message={message.replyTo} /> : null}

          {message.isDeleted ? (
            <p className="italic opacity-70">Message deleted</p>
          ) : (
            <>
              {/* Audio player for voice notes */}
              {message.type === 'audio' && message.fileUrl ? (
                <div className="mb-2">
                  <audio controls src={message.fileUrl} className="h-8 w-full" preload="metadata" />
                </div>
              ) : null}

              {/* Image / File */}
              {message.type !== 'text' && message.type !== 'audio' && message.fileUrl ? (
                <div className="mb-2 overflow-hidden rounded-xl">
                  {message.type === 'image' ? (
                    <img src={message.fileUrl} alt="" className="max-h-64 w-full object-cover" />
                  ) : (
                    <a
                      className={`text-xs underline ${isMe ? 'text-white/90' : ''}`}
                      href={message.fileUrl}
                      target="_blank"
                    >
                      📄 Download file
                    </a>
                  )}
                </div>
              ) : null}

              {message.content ? <p>{message.content}</p> : null}
            </>
          )}

          <div className="mt-2 flex items-center justify-between gap-3 text-[10px] opacity-70">
            <span className="flex items-center gap-1">
              {message.isPinned ? '📌 ' : ''}
              {formatTime(message.createdAt)}
              {message.isEdited ? (
                <button
                  onClick={() => setShowHistory(true)}
                  className="ml-1 underline opacity-80 hover:opacity-100"
                >
                  edited
                </button>
              ) : null}
            </span>
            <span>
              {(() => {
                if (!isMe) return null
                const otherReads = (message.readBy || []).filter(
                  (r) => String(r.userId?._id || r.userId) !== String(message.senderId?._id || message.senderId)
                )
                if (otherReads.length > 0) {
                  const latestRead = otherReads.reduce((latest, current) => {
                    return new Date(current.at) > new Date(latest.at) ? current : latest
                  }, otherReads[0])
                  return `✓✓ Seen ${new Date(latestRead.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                }
                const otherDelivered = (message.deliveredTo || []).filter(
                  (d) => String(d.userId?._id || d.userId) !== String(message.senderId?._id || message.senderId)
                )
                if (otherDelivered.length > 0) {
                  const latestDelivered = otherDelivered.reduce((latest, current) => {
                    return new Date(current.at) > new Date(latest.at) ? current : latest
                  }, otherDelivered[0])
                  return `✓ Delivered ${new Date(latestDelivered.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                }
                return '✓ Sent'
              })()}
            </span>
          </div>

          {message.reactions?.length ? (
            <div className="mt-2 flex gap-1 text-base">
              {message.reactions.map((r) => (
                <span key={r.userId}>{r.emoji}</span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Context menu */}
        {showMenu && !message.isDeleted ? (
          <div
            className={`absolute top-full z-20 mt-1 rounded-xl border border-black/10 bg-white py-1.5 shadow-lg ${
              isMe ? 'right-0' : 'left-0'
            }`}
          >
            {[
              { label: '↩ Reply', fn: () => onReply?.(message) },
              { label: '↗ Forward', fn: () => onForward?.(message) },
              isMe ? { label: '✏ Edit', fn: () => onEdit?.(message) } : null,
              { label: message.isPinned ? '📌 Unpin' : '📌 Pin', fn: () => onPin?.(message._id) },
              { label: '⭐ Star', fn: () => onStar?.(message._id) },
              { label: '❤️', fn: () => {} },
              isMe ? { label: '🗑 Delete', fn: () => onDelete?.(message._id) } : null
            ]
              .filter(Boolean)
              .map((item) => (
                <button
                  key={item.label}
                  className="block w-full px-4 py-1.5 text-left text-xs hover:bg-black/5"
                  onClick={() => {
                    item.fn()
                    setShowMenu(false)
                  }}
                >
                  {item.label}
                </button>
              ))}
          </div>
        ) : null}
      </div>

      {showHistory ? (
        <EditHistoryModal history={message.editHistory} onClose={() => setShowHistory(false)} />
      ) : null}
    </>
  )
}

export default MessageBubble
