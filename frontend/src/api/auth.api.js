import api from './axios.js'

export const register = async (payload) => {
  const res = await api.post('/auth/register', payload)
  return res.data.data
}

export const login = async (payload) => {
  const res = await api.post('/auth/login', payload)
  return res.data.data
}

export const logout = async () => {
  const res = await api.post('/auth/logout')
  return res.data.data
}

export const logoutAll = async () => {
  const res = await api.post('/auth/logout-all')
  return res.data.data
}

export const refresh = async () => {
  const res = await api.post('/auth/refresh')
  return res.data.data
}

export const me = async () => {
  const res = await api.get('/auth/me')
  return res.data.data
}

/* ── Multi-Device Session Management ── */
export const getDevices = async () => {
  const res = await api.get('/auth/devices')
  return res.data.data
}

export const revokeDevice = async (tokenId) => {
  const res = await api.delete(`/auth/devices/${tokenId}`)
  return res.data.data
}
