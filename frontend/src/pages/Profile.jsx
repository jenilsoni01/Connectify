import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { uploadProfile } from '../api/upload.api.js'
import { decryptMessage } from '../utils/crypto.js'
import * as authApi from '../api/auth.api.js'
import * as userApi from '../api/user.api.js'
import Button from '../components/common/Button.jsx'
import ProfileModal from '../components/user/ProfileModal.jsx'
import Modal from '../components/common/Modal.jsx'
import { formatRelative } from '../utils/formatTime.js'

const Profile = () => {
  const { user, privateKey, updateProfile, logoutAll } = useAuth()
  const [open, setOpen] = useState(false)

  /* Multi-device */
  const [devices, setDevices] = useState([])
  const [loadingDevices, setLoadingDevices] = useState(false)

  /* Status privacy */
  const [privacy, setPrivacy] = useState(user?.statusPrivacy || 'everyone')
  const [savingPrivacy, setSavingPrivacy] = useState(false)

  /* Starred messages */
  const [starred, setStarred] = useState([])
  const [showStarred, setShowStarred] = useState(false)

  const loadDevices = async () => {
    setLoadingDevices(true)
    try {
      const res = await authApi.getDevices()
      setDevices(res)
    } catch { /* ignore */ }
    setLoadingDevices(false)
  }

  const revokeDevice = async (tokenId) => {
    await authApi.revokeDevice(tokenId)
    setDevices((prev) => prev.filter((d) => d._id !== tokenId))
  }

  const loadStarred = async () => {
    try {
      const res = await userApi.getStarredMessages()
      if (privateKey) {
        const decryptedList = await Promise.all(res.map(async (msg) => {
          if (msg?.encryptedContent && msg?.encryptedKeys) {
            const myKey = msg.encryptedKeys[user._id]
            if (myKey) {
              try {
                const decrypted = await decryptMessage(msg.encryptedContent, myKey, privateKey)
                return { ...msg, content: decrypted }
              } catch (e) { /* ignore */ }
            }
          }
          return msg
        }))
        setStarred(decryptedList)
      } else {
        setStarred(res)
      }
    } catch { /* ignore */ }
  }

  const handleUnstar = async (messageId) => {
    await userApi.unstarMessage(messageId)
    setStarred((prev) => prev.filter((m) => m._id !== messageId))
  }

  const savePrivacy = async () => {
    setSavingPrivacy(true)
    try {
      await userApi.updateStatusPrivacy({ privacy })
    } catch { /* ignore */ }
    setSavingPrivacy(false)
  }

  useEffect(() => {
    loadDevices()
    loadStarred()
  }, [])

  const uploadPic = async (file) => {
    const res = await uploadProfile(file)
    await updateProfile({ profilePic: res.url })
  }

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="flex items-center justify-between rounded-2xl bg-white/80 p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-black/10">
            {user?.profilePic ? (
              <img src={user.profilePic} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div>
            <p className="text-lg font-semibold">{user?.name}</p>
            <p className="text-xs text-[var(--muted)]">{user?.email}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{user?.bio || 'No bio yet'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="soft" onClick={() => setOpen(true)}>
            Edit
          </Button>
          <Button variant="ghost" onClick={logoutAll}>
            Logout all
          </Button>
        </div>
      </div>

      {/* Profile picture upload */}
      <div className="rounded-2xl bg-white/80 p-4">
        <p className="text-sm font-semibold">Update profile picture</p>
        <input
          type="file"
          onChange={(e) => e.target.files?.[0] && uploadPic(e.target.files[0])}
          className="mt-3 text-sm"
        />
      </div>

      {/* Status Privacy */}
      <div className="rounded-2xl bg-white/80 p-4">
        <h3 className="mb-3 text-sm font-semibold">🔒 Status Privacy</h3>
        <p className="mb-3 text-xs text-[var(--muted)]">Control who can view your stories/status updates</p>
        <div className="flex flex-wrap gap-2">
          {['everyone', 'contacts', 'nobody', 'custom'].map((opt) => (
            <button
              key={opt}
              onClick={() => setPrivacy(opt)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold capitalize transition ${
                privacy === opt
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-black/5 text-[var(--muted)] hover:bg-black/10'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <Button onClick={savePrivacy} disabled={savingPrivacy} className="mt-3">
          {savingPrivacy ? 'Saving...' : 'Save Privacy'}
        </Button>
      </div>

      {/* Linked Devices / Multi-device */}
      <div className="rounded-2xl bg-white/80 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">📱 Linked Devices</h3>
          <button onClick={loadDevices} className="text-xs text-[var(--accent)]">
            Refresh
          </button>
        </div>
        {loadingDevices ? (
          <p className="text-xs text-[var(--muted)]">Loading...</p>
        ) : devices.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">No active sessions</p>
        ) : (
          <div className="space-y-2">
            {devices.map((device) => (
              <div
                key={device._id}
                className="flex items-center justify-between rounded-xl bg-black/5 px-4 py-3"
              >
                <div>
                  <p className="text-xs font-semibold">{device.deviceName}</p>
                  <p className="text-[10px] text-[var(--muted)]">
                    Last active: {device.lastActiveAt ? formatRelative(device.lastActiveAt) : 'Unknown'}
                  </p>
                </div>
                <button
                  onClick={() => revokeDevice(device._id)}
                  className="rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-semibold text-red-600 hover:bg-red-100"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Starred Messages */}
      <div className="rounded-2xl bg-white/80 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">⭐ Starred Messages</h3>
          <button onClick={() => setShowStarred(!showStarred)} className="text-xs text-[var(--accent)]">
            {showStarred ? 'Hide' : `Show (${starred.length})`}
          </button>
        </div>
        {showStarred ? (
          starred.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">No starred messages</p>
          ) : (
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {starred.map((msg) => (
                <div key={msg._id} className="flex items-center justify-between rounded-xl bg-black/5 px-4 py-3">
                  <div className="flex-1">
                    <p className="text-xs font-semibold">{msg.senderId?.name || 'Unknown'}</p>
                    <p className="truncate text-xs text-[var(--muted)]">{msg.content || '📎 Attachment'}</p>
                  </div>
                  <button
                    onClick={() => handleUnstar(msg._id)}
                    className="ml-3 text-xs text-[var(--muted)] hover:text-black"
                  >
                    Unstar
                  </button>
                </div>
              ))}
            </div>
          )
        ) : null}
      </div>

      <ProfileModal open={open} onClose={() => setOpen(false)} user={user} onSave={updateProfile} />
    </div>
  )
}

export default Profile
