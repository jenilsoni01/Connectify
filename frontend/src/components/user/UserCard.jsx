import Button from '../common/Button.jsx'

const UserCard = ({ user, onAdd, onAccept, onReject, onBlock, onReport, onMessage, subtitle }) => {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 rounded-full bg-black/10">
          {user.profilePic ? (
            <img src={user.profilePic} alt="" className="h-full w-full rounded-full object-cover" />
          ) : null}
          {user.isOnline ? (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" title="Online" />
          ) : null}
        </div>
        <div>
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="text-xs text-[var(--muted)]">{subtitle || user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onMessage ? (
          <Button variant="soft" onClick={() => onMessage(user._id)}>
            💬 Message
          </Button>
        ) : null}
        {onAdd ? <Button onClick={() => onAdd(user._id)}>Add</Button> : null}
        {onAccept ? (
          <Button variant="soft" onClick={() => onAccept(user._id)}>
            Accept
          </Button>
        ) : null}
        {onReject ? (
          <Button variant="ghost" onClick={() => onReject(user._id)}>
            Reject
          </Button>
        ) : null}
        {onBlock ? (
          <Button variant="ghost" onClick={() => onBlock(user._id)}>
            Block
          </Button>
        ) : null}
        {onReport ? (
          <Button variant="ghost" onClick={() => onReport(user._id)}>
            Report
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export default UserCard
