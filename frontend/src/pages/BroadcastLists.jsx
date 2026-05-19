import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import * as broadcastApi from '../api/broadcast.api.js'
import * as userApi from '../api/user.api.js'
import { encryptMessage } from '../utils/crypto.js'
import Button from '../components/common/Button.jsx'
import Modal from '../components/common/Modal.jsx'
import Loader from '../components/common/Loader.jsx'

const BroadcastLists = () => {
  const { user } = useAuth()
  const [broadcasts, setBroadcasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selected, setSelected] = useState([])
  const [activeBroadcast, setActiveBroadcast] = useState(null)
  const [messageText, setMessageText] = useState('')

  const load = async () => {
    setLoading(true)
    const res = await broadcastApi.getMyBroadcasts()
    setBroadcasts(res)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleSearch = async (q) => {
    setSearchQ(q)
    if (q.length < 2) { setSearchResults([]); return }
    const res = await userApi.searchUsers(q)
    setSearchResults(res)
  }

  const toggleSelect = (userId) => {
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleCreate = async () => {
    if (!name.trim() || selected.length === 0) return
    await broadcastApi.createBroadcast({ name, members: selected })
    setShowCreate(false)
    setName('')
    setSelected([])
    setSearchQ('')
    setSearchResults([])
    load()
  }

  const handleSend = async () => {
    if (!activeBroadcast || !messageText.trim()) return
    
    let payload = { content: messageText }
    
    try {
      const memberIds = activeBroadcast.members.map(m => String(m._id || m))
      const keys = await userApi.getPublicKeys(memberIds)
      const keyMap = {}
      keys.forEach((k) => {
        if (k.publicKey) keyMap[k._id] = k.publicKey
      })
      
      if (Object.keys(keyMap).length > 0) {
        const { encryptedContent, encryptedKeys } = await encryptMessage(messageText, keyMap)
        payload = { content: '', encryptedContent, encryptedKeys }
      }
    } catch (err) {
      console.error('Failed to encrypt broadcast', err)
    }

    await broadcastApi.sendBroadcast(activeBroadcast._id, payload)
    setMessageText('')
  }

  if (loading) return <Loader />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">📢 Broadcast Lists</h2>
        <Button onClick={() => setShowCreate(true)}>New Broadcast</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* List */}
        <div className="space-y-3">
          {broadcasts.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No broadcast lists yet</p>
          ) : null}
          {broadcasts.map((b) => (
            <button
              key={b._id}
              onClick={() => setActiveBroadcast(b)}
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                activeBroadcast?._id === b._id
                  ? 'border-black/20 bg-black/5'
                  : 'border-transparent bg-white/70 hover:bg-white'
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10 text-lg">
                📢
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Broadcast</p>
                <p className="text-xs text-[var(--muted)]">{b.members?.length || 0} recipients</p>
              </div>
            </button>
          ))}
        </div>

        {/* Compose area */}
        {activeBroadcast ? (
          <div className="space-y-4 rounded-2xl bg-white/80 p-6">
            <h3 className="text-sm font-semibold">Send to Broadcast</h3>
            <p className="text-xs text-[var(--muted)]">
              {activeBroadcast.members?.length} recipients — messages are sent as individual DMs
            </p>
            <div className="flex gap-2">
              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a broadcast message..."
                className="flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black/30"
              />
              <Button onClick={handleSend}>Send</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center text-sm text-[var(--muted)]">
            Select a broadcast list to compose
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate ? (
        <Modal open={showCreate} onClose={() => setShowCreate(false)}>
          <h3 className="mb-4 text-sm font-semibold">Create Broadcast List</h3>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="List name"
            className="mb-3 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none"
          />
          <input
            value={searchQ}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users to add..."
            className="mb-3 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none"
          />
          <div className="mb-3 max-h-40 space-y-1 overflow-y-auto">
            {searchResults.map((u) => (
              <button
                key={u._id}
                onClick={() => toggleSelect(u._id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                  selected.includes(u._id) ? 'bg-[var(--accent)]/10 font-semibold' : 'hover:bg-black/5'
                }`}
              >
                <span>{selected.includes(u._id) ? '☑' : '☐'}</span>
                <span>{u.name}</span>
                <span className="text-[var(--muted)]">{u.email}</span>
              </button>
            ))}
          </div>
          {selected.length > 0 ? (
            <p className="mb-3 text-xs text-[var(--muted)]">{selected.length} selected</p>
          ) : null}
          <Button onClick={handleCreate} disabled={!name.trim() || selected.length === 0}>
            Create
          </Button>
        </Modal>
      ) : null}
    </div>
  )
}

export default BroadcastLists
