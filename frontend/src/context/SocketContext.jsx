import { createContext, useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../hooks/useAuth.js'

export const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const { accessToken } = useAuth()
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!accessToken) {
      if (socket) socket.disconnect()
      setSocket(null)
      setConnected(false)
      return
    }
    const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000/chat'
    const nextSocket = io(url, {
      auth: { token: accessToken }
    })
    nextSocket.on('connect', () => {
      setConnected(true)
      nextSocket.emit('auth:token', accessToken)
    })
    nextSocket.on('disconnect', () => setConnected(false))
    setSocket(nextSocket)
    return () => nextSocket.disconnect()
  }, [accessToken])

  const value = useMemo(() => ({ socket, connected }), [socket, connected])

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
