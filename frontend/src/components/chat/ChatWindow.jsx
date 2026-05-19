import { useEffect, useRef, useState } from 'react'
import MessageBubble from './MessageBubble.jsx'
import TypingIndicator from './TypingIndicator.jsx'
import Button from '../common/Button.jsx'
import Modal from '../common/Modal.jsx'

const ChatWindow = ({
  conversation,
  messages,
  conversations,
  pinnedMessages,
  onSend,
  onReact,
  onDelete,
  onTyping,
  onReply,
  onForward,
  onEdit,
  onPin,
  onStar,
  typingLabel,
  canSend = true,
  replyTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  userId,
  onClearChat,
  onDeleteChat,
  onLeaveGroup,
  onSetDisappearing
}) => {
  const isGroupMember = conversation?.isGroup && conversation.members?.some(m => String(m._id || m) === String(userId));
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [showForwardModal, setShowForwardModal] = useState(false)
  const [forwardTarget, setForwardTarget] = useState(null)
  const [showPinBar, setShowPinBar] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const fileRef = useRef(null)
  const timerRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content || '')
    }
  }, [editingMessage])

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl('')
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleTyping = (value) => {
    if (!onTyping) return
    onTyping(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onTyping(false), 1500)
  }

  const submit = (e) => {
    e.preventDefault()
    if (!canSend) return

    /* Edit mode */
    if (editingMessage) {
      if (!text.trim()) return
      onEdit(editingMessage._id, text)
      setText('')
      return
    }

    /* Voice note */
    if (audioBlob) {
      const audioFile = new File([audioBlob], 'voice-note.webm', { type: 'audio/webm' })
      onSend({ content: '', file: audioFile, type: 'audio', replyTo: replyTo?._id })
      setAudioBlob(null)
      if (onCancelReply) onCancelReply()
      return
    }

    if (!text.trim() && !file) return
    onSend({ content: text, file, replyTo: replyTo?._id })
    setText('')
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
    if (onCancelReply) onCancelReply()
    handleTyping(false)
  }

  const onFileChange = (e) => {
    if (!canSend) return
    const file = e.target.files?.[0]
    if (!file) return
    setFile(file)
  }

  const discardFile = () => {
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  /* ── Voice Recording ── */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      console.error('Microphone access denied', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const discardRecording = () => {
    setAudioBlob(null)
    setIsRecording(false)
  }

  /* ── Forward handler ── */
  const handleForwardSelect = (msg) => {
    setForwardTarget(msg)
    setShowForwardModal(true)
  }

  const confirmForward = (targetConversationId) => {
    if (onForward && forwardTarget) {
      onForward(forwardTarget._id, targetConversationId)
    }
    setShowForwardModal(false)
    setForwardTarget(null)
  }

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
        Select a conversation to start chatting
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="mb-4 flex items-center justify-between border-b border-black/5 pb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-black/10">
            {conversation.isGroup && conversation.group?.groupPic ? (
              <img src={conversation.group.groupPic} alt="" className="h-full w-full object-cover" />
            ) : !conversation.isGroup && conversation.members?.find(m => String(m._id || m) !== String(userId))?.profilePic ? (
              <img src={conversation.members.find(m => String(m._id || m) !== String(userId)).profilePic} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div>
            <h3 className="text-sm font-semibold">
              {conversation.isBroadcast 
                ? '📢 Broadcast' 
                : conversation.isGroup 
                ? conversation.group?.name || 'Group'
                : conversation.members?.find(m => String(m._id || m) !== String(userId))?.name || 'Chat'}
            </h3>
            <p className="text-[10px] text-[var(--muted)]">
              {conversation.isBroadcast 
                ? 'Broadcast List' 
                : conversation.isGroup 
                ? 'Group Chat' 
                : conversation.members?.find((m) => String(m._id || m) !== String(userId))?.isOnline 
                ? '🟢 Active now' 
                : '⚫ Offline'}
            </p>
          </div>
        </div>

        {/* Dropdown Options */}
        <div className="relative">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-xl bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10 transition"
          >
            ⚙️ Options
          </button>
          
          {showSettings && (
            <div className="absolute right-0 top-full z-30 mt-2 w-48 rounded-xl border border-black/10 bg-white py-1.5 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setShowSettings(false);
                  const timer = prompt("Enter disappearing timer in seconds (e.g. 0 to disable, 3600 for 1h, 86400 for 1d):", conversation.disappearingTimer);
                  if (timer !== null) onSetDisappearing?.(Number(timer));
                }}
                className="block w-full px-4 py-1.5 text-left text-xs hover:bg-black/5"
              >
                ⏱ Set Disappearing Messages
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSettings(false);
                  if (confirm("Are you sure you want to clear all message history?")) {
                    onClearChat?.();
                  }
                }}
                className="block w-full px-4 py-1.5 text-left text-xs hover:bg-black/5 text-amber-600 font-semibold"
              >
                🧹 Clear History
              </button>
              {conversation.isGroup && isGroupMember ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowSettings(false);
                    if (confirm("Are you sure you want to leave this group?")) {
                      onLeaveGroup?.();
                    }
                  }}
                  className="block w-full px-4 py-1.5 text-left text-xs hover:bg-black/5 text-red-600 font-semibold"
                >
                  🚪 Leave Group
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowSettings(false);
                    const label = conversation.isGroup ? "group" : "chat";
                    if (confirm(`Are you sure you want to delete this ${label} entirely?`)) {
                      onDeleteChat?.();
                    }
                  }}
                  className="block w-full px-4 py-1.5 text-left text-xs hover:bg-black/5 text-red-600 font-semibold"
                >
                  🗑 {conversation.isGroup ? "Delete Group" : "Delete Chat"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Pinned messages bar */}
      {pinnedMessages?.length > 0 ? (
        <div className="mb-2 rounded-2xl border border-black/10 bg-amber-50 px-4 py-2">
          <button
            className="flex w-full items-center justify-between text-xs font-semibold"
            onClick={() => setShowPinBar(!showPinBar)}
          >
            <span>📌 {pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? 's' : ''}</span>
            <span className="text-[10px] text-[var(--muted)]">{showPinBar ? 'Hide' : 'Show'}</span>
          </button>
          {showPinBar ? (
            <div className="mt-2 max-h-32 space-y-1 overflow-y-auto">
              {pinnedMessages.map((pm) => (
                <p key={pm._id} className="truncate text-xs text-[var(--muted)]">
                  {pm.content || '📎 Attachment'}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Disappearing timer badge */}
      {conversation.disappearingTimer > 0 ? (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-black/5 px-3 py-1.5 text-[10px] text-[var(--muted)]">
          <span>⏱</span>
          <span>
            Disappearing messages: {conversation.disappearingTimer >= 86400
              ? `${Math.round(conversation.disappearingTimer / 86400)}d`
              : `${Math.round(conversation.disappearingTimer / 3600)}h`}
          </span>
        </div>
      ) : null}

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-white/80 p-4">
        {messages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            isMe={message.isMine}
            onReply={onReply}
            onForward={handleForwardSelect}
            onEdit={(msg) => onEdit?.(msg)}
            onPin={(id) => onPin?.(id)}
            onStar={(id) => onStar?.(id)}
            onDelete={(id) => onDelete?.(id)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <TypingIndicator label={typingLabel} />
      </div>

      {!canSend ? (
        <div className="mt-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs text-[var(--muted)]">
          Only admins can send messages in this group.
        </div>
      ) : null}

      {/* Reply preview bar */}
      {replyTo ? (
        <div className="mt-2 flex items-center justify-between rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-2 text-xs">
          <div>
            <p className="font-semibold text-[var(--accent)]">↩ Replying to</p>
            <p className="truncate text-[var(--muted)]">{replyTo.content || '📎 Attachment'}</p>
          </div>
          <button onClick={onCancelReply} className="text-[var(--muted)] hover:text-black">✕</button>
        </div>
      ) : null}

      {/* Edit mode bar */}
      {editingMessage ? (
        <div className="mt-2 flex items-center justify-between rounded-2xl border border-amber-300/50 bg-amber-50 px-4 py-2 text-xs">
          <p className="font-semibold text-amber-700">✏ Editing message</p>
          <button onClick={onCancelEdit} className="text-[var(--muted)] hover:text-black">✕</button>
        </div>
      ) : null}

      {/* Audio recording preview */}
      {audioBlob ? (
        <div className="mt-2 flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs">
          <audio controls src={URL.createObjectURL(audioBlob)} className="h-8 flex-1" />
          <button onClick={discardRecording} className="text-[var(--muted)]">Discard</button>
        </div>
      ) : null}

      {/* File preview */}
      {file ? (
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs">
          <div className="flex items-center gap-3">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-black/10" />
            )}
            <div>
              <p className="font-semibold">{file.name}</p>
              <p className="text-[var(--muted)]">{Math.round(file.size / 1024)} KB</p>
            </div>
          </div>
          <button type="button" className="text-[var(--muted)]" onClick={discardFile}>
            Discard
          </button>
        </div>
      ) : null}

      {/* Input form */}
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            handleTyping(true)
          }}
          placeholder={editingMessage ? 'Edit message...' : 'Type a message...'}
          className="flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black/30"
          disabled={!canSend}
        />
        <input ref={fileRef} type="file" onChange={onFileChange} className="hidden" />
        <Button type="button" variant="soft" onClick={() => fileRef.current?.click()} disabled={!canSend}>
          📎
        </Button>
        {!isRecording ? (
          <Button type="button" variant="soft" onClick={startRecording} disabled={!canSend}>
            🎙
          </Button>
        ) : (
          <Button type="button" variant="soft" onClick={stopRecording} className="animate-pulse">
            ⏹
          </Button>
        )}
        <Button type="submit" disabled={!canSend}>
          {editingMessage ? '✓ Save' : 'Send'}
        </Button>
      </form>

      {/* Forward modal */}
      {showForwardModal ? (
        <Modal open={showForwardModal} onClose={() => setShowForwardModal(false)}>
          <h3 className="mb-3 text-sm font-semibold">Forward to...</h3>
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {(conversations || [])
              .filter((c) => c._id !== conversation._id)
              .map((c) => (
                <button
                  key={c._id}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-black/5"
                  onClick={() => confirmForward(c._id)}
                >
                  <div className="h-8 w-8 rounded-full bg-black/10" />
                  <span>
                    {c.isBroadcast 
                      ? '📢 Broadcast List' 
                      : c.isGroup 
                      ? c.group?.name || 'Group' 
                      : c.members?.find((m) => String(m._id || m) !== String(userId))?.name || 'Chat'}
                  </span>
                </button>
              ))}
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

export default ChatWindow
