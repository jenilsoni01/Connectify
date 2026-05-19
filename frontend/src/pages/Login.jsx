import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import Button from '../components/common/Button.jsx'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    await login({ email, password })
    navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-[var(--card)] p-8 shadow-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Connectify</p>
        <h1 className="mt-2 text-3xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Log in to continue chatting.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            required
          />
          <Button className="w-full" type="submit">
            Login
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          New here? <Link to="/register" className="text-[var(--accent)]">Create account</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
