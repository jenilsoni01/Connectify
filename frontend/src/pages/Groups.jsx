import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import * as chatApi from '../api/chat.api.js'
import * as friendApi from '../api/friend.api.js'
import CreateGroupModal from '../components/group/CreateGroupModal.jsx'
import Button from '../components/common/Button.jsx'
import Loader from '../components/common/Loader.jsx'

const Groups = () => {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [friends, setFriends] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState('')
  const [groupName, setGroupName] = useState('')
  const [settings, setSettings] = useState({
    onlyAdminsCanSend: false,
    onlyAdminsCanEdit: false,
    onlyAdminsCanAdd: false
  })
  const [selectedFriend, setSelectedFriend] = useState('')

  const load = async () => {
    setLoading(true)
    const [convRes, friendsRes] = await Promise.all([
      chatApi.getMyConversations(),
      friendApi.listFriends()
    ])
    setGroups(convRes.filter((c) => c.isGroup))
    setFriends(friendsRes)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const activeGroup = useMemo(() => {
    if (!groups.length) return null
    const found = groups.find((g) => g._id === activeId)
    return found || groups[0]
  }, [groups, activeId])

  useEffect(() => {
    if (!activeGroup) return
    setActiveId(activeGroup._id)
    setGroupName(activeGroup.group?.name || '')
    setSettings({
      onlyAdminsCanSend: Boolean(activeGroup.group?.onlyAdminsCanSend),
      onlyAdminsCanEdit: Boolean(activeGroup.group?.onlyAdminsCanEdit),
      onlyAdminsCanAdd: Boolean(activeGroup.group?.onlyAdminsCanAdd)
    })
  }, [activeGroup?._id])

  const createGroup = async (payload) => {
    await chatApi.createGroup(payload)
    setOpen(false)
    load()
  }

  const isAdmin = activeGroup?.group?.admins?.some(
    (id) => String(id) === String(user?._id)
  )

  const members = activeGroup?.members || []
  const availableFriends = friends.filter(
    (friend) => !members.some((member) => String(member._id) === String(friend._id))
  )

  const addMember = async () => {
    if (!selectedFriend || !activeGroup) return
    await chatApi.addGroupMember({ conversationId: activeGroup._id, memberId: selectedFriend })
    setSelectedFriend('')
    load()
  }

  const removeMember = async (memberId) => {
    if (!activeGroup) return
    const label = String(memberId) === String(user?._id) ? 'Leave this group?' : 'Remove this member?'
    if (!window.confirm(label)) return
    await chatApi.removeGroupMember({ conversationId: activeGroup._id, memberId })
    if (String(memberId) === String(user?._id)) {
      setActiveId('')
    }
    load()
  }

  const makeAdmin = async (memberId) => {
    if (!activeGroup) return
    if (!window.confirm('Make this member an admin?')) return
    await chatApi.makeGroupAdmin({ conversationId: activeGroup._id, memberId })
    load()
  }

  const saveSettings = async () => {
    if (!activeGroup) return
    if (!window.confirm('Update group settings?')) return
    await chatApi.updateGroup({
      conversationId: activeGroup._id,
      name: groupName,
      ...settings
    })
    load()
  }

  if (loading) return <Loader />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Groups</h2>
        <Button onClick={() => setOpen(true)}>Create group</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="space-y-3">
          {groups.map((group) => (
            <button
              key={group._id}
              className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                activeGroup?._id === group._id ? 'bg-white shadow-sm' : 'bg-white/70'
              }`}
              onClick={() => setActiveId(group._id)}
            >
              <p className="text-sm font-semibold">{group.group?.name || 'Group'}</p>
              <p className="text-xs text-[var(--muted)]">{group.members.length} members</p>
            </button>
          ))}
        </div>
        <div className="space-y-6">
          {activeGroup ? (
            <>
              <div className="rounded-2xl bg-white/80 p-4">
                <h3 className="text-sm font-semibold">Group settings</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr]">
                  <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Group name"
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                    disabled={!isAdmin && activeGroup.group?.onlyAdminsCanEdit}
                  />
                  <div className="flex flex-col gap-2 text-xs text-[var(--muted)]">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.onlyAdminsCanSend}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, onlyAdminsCanSend: e.target.checked }))
                        }
                        disabled={!isAdmin}
                      />
                      Only admins can send messages
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.onlyAdminsCanEdit}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, onlyAdminsCanEdit: e.target.checked }))
                        }
                        disabled={!isAdmin}
                      />
                      Only admins can edit group info
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.onlyAdminsCanAdd}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, onlyAdminsCanAdd: e.target.checked }))
                        }
                        disabled={!isAdmin}
                      />
                      Only admins can add members
                    </label>
                  </div>
                </div>
                {isAdmin ? (
                  <div className="mt-4 flex justify-end">
                    <Button onClick={saveSettings}>Save settings</Button>
                  </div>
                ) : null}
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <h3 className="text-sm font-semibold">Members</h3>
                <div className="mt-3 space-y-2">
                  {members.map((member) => {
                    const memberIsAdmin = activeGroup.group?.admins?.some(
                      (id) => String(id) === String(member._id)
                    )
                    return (
                      <div key={member._id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-[var(--muted)]">{member.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {memberIsAdmin ? (
                            <span className="rounded-full bg-black/10 px-2 py-1 text-[10px]">Admin</span>
                          ) : null}
                          {isAdmin && !memberIsAdmin ? (
                            <Button variant="ghost" onClick={() => makeAdmin(member._id)}>
                              Make admin
                            </Button>
                          ) : null}
                          {(isAdmin || String(member._id) === String(user?._id)) ? (
                            <Button variant="ghost" onClick={() => removeMember(member._id)}>
                              {String(member._id) === String(user?._id) ? 'Leave' : 'Remove'}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <h3 className="text-sm font-semibold">Add member</h3>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    value={selectedFriend}
                    onChange={(e) => setSelectedFriend(e.target.value)}
                    className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                    disabled={!availableFriends.length || (activeGroup.group?.onlyAdminsCanAdd && !isAdmin)}
                  >
                    <option value="">Select a friend</option>
                    {availableFriends.map((friend) => (
                      <option key={friend._id} value={friend._id}>
                        {friend.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={addMember}
                    disabled={!selectedFriend || (activeGroup.group?.onlyAdminsCanAdd && !isAdmin)}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-white/80 p-6 text-sm text-[var(--muted)]">
              Create a group to manage members and permissions.
            </div>
          )}
        </div>
      </div>
      <CreateGroupModal open={open} onClose={() => setOpen(false)} friends={friends} onCreate={createGroup} />
    </div>
  )
}

export default Groups
