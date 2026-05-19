import api from './axios.js'

export const createConversation = async (userId) => {
  const res = await api.post(`/conversations/create/${userId}`)
  return res.data.data
}

export const getMyConversations = async () => {
  const res = await api.get('/conversations/my')
  return res.data.data
}

export const getConversation = async (id) => {
  const res = await api.get(`/conversations/${id}`)
  return res.data.data
}

export const sendMessage = async (conversationId, payload) => {
  const res = await api.post(`/messages/send/${conversationId}`, payload)
  return res.data.data
}

export const getMessages = async (conversationId, page = 1, limit = 20) => {
  const res = await api.get(`/messages/${conversationId}?page=${page}&limit=${limit}`)
  return res.data.data
}

export const markRead = async (conversationId) => {
  const res = await api.put(`/messages/read/${conversationId}`)
  return res.data.data
}

export const deleteMessage = async (messageId) => {
  const res = await api.put(`/messages/delete/${messageId}`)
  return res.data.data
}

export const reactMessage = async (messageId, emoji) => {
  const res = await api.post(`/messages/react/${messageId}`, { emoji })
  return res.data.data
}

export const editMessage = async (messageId, payload) => {
  const res = await api.put(`/messages/edit/${messageId}`, payload)
  return res.data.data
}

export const forwardMessage = async (messageId, targetConversationId) => {
  const res = await api.post(`/messages/forward/${messageId}`, { targetConversationId })
  return res.data.data
}

export const pinMessage = async (messageId) => {
  const res = await api.put(`/messages/pin/${messageId}`)
  return res.data.data
}

export const setDisappearing = async (conversationId, timer) => {
  const res = await api.put(`/conversations/${conversationId}/disappearing`, { timer })
  return res.data.data
}

export const getPinnedMessages = async (conversationId) => {
  const res = await api.get(`/conversations/${conversationId}/pinned`)
  return res.data.data
}

export const createGroup = async (payload) => {
  const res = await api.post('/groups/create', payload)
  return res.data.data
}

export const addGroupMember = async (payload) => {
  const res = await api.put('/groups/add-member', payload)
  return res.data.data
}

export const removeGroupMember = async (payload) => {
  const res = await api.put('/groups/remove-member', payload)
  return res.data.data
}

export const makeGroupAdmin = async (payload) => {
  const res = await api.put('/groups/make-admin', payload)
  return res.data.data
}

export const updateGroup = async (payload) => {
  const res = await api.put('/groups/update', payload)
  return res.data.data
}

export const deleteConversation = async (id) => {
  const res = await api.delete(`/conversations/${id}`)
  return res.data.data
}

export const clearConversation = async (id) => {
  const res = await api.delete(`/conversations/${id}/clear`)
  return res.data.data
}
