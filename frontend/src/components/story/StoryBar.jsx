const StoryBar = ({ groups, onSelect }) => {
  return (
    <div className="flex gap-4 overflow-x-auto rounded-2xl bg-white/80 p-4">
      {groups.map((group) => (
        <button
          key={group.user._id}
          onClick={() => onSelect(group)}
          className="flex flex-col items-center gap-2"
        >
          <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-[var(--accent)]">
            {group.user.profilePic ? (
              <img src={group.user.profilePic} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-black/10" />
            )}
          </div>
          <span className="text-xs text-[var(--muted)]">{group.user.name}</span>
        </button>
      ))}
    </div>
  )
}

export default StoryBar
