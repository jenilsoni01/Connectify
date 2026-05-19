import api from './axios.js'

export const getNotifications = async () => {
  const res = await api.get('/notifications/my')
  return res.data.data
}

export const markNotificationRead = async (id) => {
  const res = await api.put(`/notifications/read/${id}`)
  return res.data.data
}

export const markAllRead = async () => {
  const res = await api.put('/notifications/read-all')
  return res.data.data
}
