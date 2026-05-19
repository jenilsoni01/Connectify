import { NavLink } from 'react-router-dom'

const links = [
  { to: '/chats', label: 'Chats' },
  { to: '/stories', label: 'Stories' },
  { to: '/friends', label: 'Friends' },
  { to: '/groups', label: 'Groups' },
  { to: '/broadcasts', label: 'Broadcasts' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/profile', label: 'Profile' }
]

const Sidebar = () => {
  return (
    <aside className="rounded-2xl bg-[var(--card)] p-4 shadow-sm">
      <div className="mb-6 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] p-4 text-white">
        <p className="text-xs uppercase tracking-[0.3em]">Status</p>
        <p className="mt-2 text-lg font-semibold">Always online</p>
      </div>
      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `rounded-xl px-4 py-2 text-sm font-medium transition ${
                isActive ? 'bg-black/10 text-black' : 'text-[var(--muted)] hover:bg-black/5'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
