import api from './axios.js'

export const createBroadcast = async (payload) => {
  const res = await api.post('/broadcasts/create', payload)
  return res.data.data
}

export const sendBroadcast = async (broadcastId, payload) => {
  const res = await api.post(`/broadcasts/send/${broadcastId}`, payload)
  return res.data.data
}

export const getMyBroadcasts = async () => {
  const res = await api.get('/broadcasts/my')
  return res.data.data
}

export const updateBroadcast = async (broadcastId, payload) => {
  const res = await api.put(`/broadcasts/update/${broadcastId}`, payload)
  return res.data.data
}
