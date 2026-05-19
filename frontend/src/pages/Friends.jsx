import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as userApi from '../api/user.api.js'
import * as friendApi from '../api/friend.api.js'
import * as chatApi from '../api/chat.api.js'
import UserCard from '../components/user/UserCard.jsx'
import Button from '../components/common/Button.jsx'

const Friends = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState({ received: [], sent: [] })
  const navigate = useNavigate()

  const startChat = async (friendId) => {
    try {
      await chatApi.createConversation(friendId)
      navigate('/chats')
    } catch (err) {
      console.error(err)
    }
  }

  const load = async () => {
    const [friendsRes, requestsRes] = await Promise.all([
      friendApi.listFriends(),
      friendApi.listRequests()
    ])
    setFriends(friendsRes)
    setRequests(requestsRes)
  }

  useEffect(() => {
    load()
  }, [])

  const search = async () => {
    if (!query.trim()) return
    const res = await userApi.searchUsers(query)
    setResults(res)
  }

  const sendRequest = async (id) => {
    await friendApi.sendRequest(id)
    load()
  }

  const block = async (id) => {
    if (!window.confirm('Block this user?')) return
    await userApi.blockUser(id)
    load()
  }

  const report = async (id) => {
    const reason = window.prompt('Report reason') || ''
    if (!reason.trim()) return
    if (!window.confirm('Submit this report?')) return
    await userApi.reportUser(id, reason)
  }

  const accept = async (id) => {
    await friendApi.acceptRequest(id)
    load()
  }

  const reject = async (id) => {
    await friendApi.rejectRequest(id)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl bg-white/80 p-4">
        <h2 className="text-lg font-semibold">Find friends</h2>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="flex-1 rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
          />
          <Button onClick={search}>Search</Button>
        </div>
        <div className="space-y-2">
          {results.map((user) => (
            <UserCard
              key={user._id}
              user={user}
              onAdd={sendRequest}
              onBlock={block}
              onReport={report}
            />
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Requests</h3>
          {requests.received.map((user) => (
            <UserCard key={user._id} user={user} onAccept={accept} onReject={reject} />
          ))}
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Friends</h3>
          {friends.map((user) => (
            <UserCard key={user._id} user={user} onMessage={startChat} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Friends
