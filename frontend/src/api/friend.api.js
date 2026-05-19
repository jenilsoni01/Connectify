import api from './axios.js'

export const sendRequest = async (id) => {
  const res = await api.post(`/friends/request/${id}`)
  return res.data.data
}

export const acceptRequest = async (id) => {
  const res = await api.post(`/friends/accept/${id}`)
  return res.data.data
}

export const rejectRequest = async (id) => {
  const res = await api.post(`/friends/reject/${id}`)
  return res.data.data
}

export const listFriends = async () => {
  const res = await api.get('/friends/list')
  return res.data.data
}

export const listRequests = async () => {
  const res = await api.get('/friends/requests')
  return res.data.data
}
