import api from './axios.js'

export const searchUsers = async (q) => {
  const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`)
  return res.data.data
}

export const getUser = async (id) => {
  const res = await api.get(`/users/${id}`)
  return res.data.data
}

export const updateUser = async (payload) => {
  const res = await api.put('/users/update', payload)
  return res.data.data
}

export const blockUser = async (id) => {
  const res = await api.put(`/users/block/${id}`)
  return res.data.data
}

export const reportUser = async (id, reason) => {
  const res = await api.post(`/users/report/${id}`, { reason })
  return res.data.data
}

/* ── Star / Unstar Messages ── */
export const starMessage = async (messageId) => {
  const res = await api.post(`/users/star/${messageId}`)
  return res.data.data
}

export const unstarMessage = async (messageId) => {
  const res = await api.delete(`/users/star/${messageId}`)
  return res.data.data
}

export const getStarredMessages = async () => {
  const res = await api.get('/users/starred')
  return res.data.data
}

/* ── Status Privacy ── */
export const updateStatusPrivacy = async (payload) => {
  const res = await api.put('/users/status-privacy', payload)
  return res.data.data
}

/* ── E2EE Public Key ── */
export const updatePublicKey = async (publicKey) => {
  const res = await api.put('/users/public-key', { publicKey })
  return res.data.data
}

export const getPublicKeys = async (userIds) => {
  const res = await api.post('/users/public-keys', { userIds })
  return res.data.data
}
