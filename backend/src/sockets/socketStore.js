let io = null

export const setSocketNamespace = (nsp) => {
  io = nsp
}

export const addUserSocket = (userId, socket) => {
  if (!socket) return
  socket.join(String(userId))
  socket.userId = String(userId)
}

export const removeSocket = (socket) => {
  if (!socket) return null
  return socket.userId || null
}

export const emitToUser = (userId, event, payload) => {
  if (!io) return
  io.to(String(userId)).emit(event, payload)
}

export const emitToUsers = (userIds, event, payload) => {
  if (!io) return
  for (const id of userIds) {
    io.to(String(id)).emit(event, payload)
  }
}

export const getSocketIds = async (userId) => {
  if (!io) return []
  try {
    const sockets = await io.in(String(userId)).fetchSockets()
    return sockets.map(s => s.id)
  } catch (err) {
    return []
  }
}
