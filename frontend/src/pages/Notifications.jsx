import { useEffect, useState } from 'react'
import * as notificationApi from '../api/notification.api.js'
import Button from '../components/common/Button.jsx'

const Notifications = () => {
  const [items, setItems] = useState([])

  const load = async () => {
    const res = await notificationApi.getNotifications()
    setItems(res)
  }

  useEffect(() => {
    load()
  }, [])

  const markRead = async (id) => {
    await notificationApi.markNotificationRead(id)
    load()
  }

  const markAll = async () => {
    await notificationApi.markAllRead()
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <Button variant="soft" onClick={markAll}>
          Mark all read
        </Button>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between rounded-2xl bg-white/80 p-4">
            <div>
              <p className="text-sm font-semibold capitalize">{item.type.replace('_', ' ')}</p>
              <p className="text-xs text-[var(--muted)]">{item.message}</p>
            </div>
            {!item.isRead ? (
              <Button variant="ghost" onClick={() => markRead(item._id)}>
                Mark read
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Notifications
