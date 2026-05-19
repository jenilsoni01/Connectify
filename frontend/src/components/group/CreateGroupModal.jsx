import { useState } from 'react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'

const CreateGroupModal = ({ open, onClose, friends, onCreate }) => {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState([])

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const submit = () => {
    if (!name.trim()) return
    onCreate({ name, members: selected })
    setName('')
    setSelected([])
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Group">
      <div className="space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
        />
        <div className="max-h-56 space-y-2 overflow-y-auto">
          {friends.map((friend) => (
            <label key={friend._id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(friend._id)}
                onChange={() => toggle(friend._id)}
              />
              {friend.name}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Create</Button>
        </div>
      </div>
    </Modal>
  )
}

export default CreateGroupModal
