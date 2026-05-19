import { useAuth } from '../../hooks/useAuth.js'
import Button from '../common/Button.jsx'

const Navbar = () => {
  const { user, logout } = useAuth()

  return (
    <div className="flex items-center justify-between rounded-2xl bg-[var(--card)] px-6 py-4 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Connectify</p>
        <h1 className="text-2xl font-semibold">Live chat + social</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="text-xs text-[var(--muted)]">{user?.email}</p>
        </div>
        <Button variant="soft" onClick={logout}>
          Logout
        </Button>
      </div>
    </div>
  )
}

export default Navbar
