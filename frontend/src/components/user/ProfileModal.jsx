import { useState } from 'react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'

const ProfileModal = ({ open, onClose, user, onSave }) => {
  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState(user?.bio || '')

  const submit = () => {
    onSave({ name, bio })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit profile">
      <div className="space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
        />
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Bio"
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
          rows={4}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Save</Button>
        </div>
      </div>
    </Modal>
  )
}

export default ProfileModal
