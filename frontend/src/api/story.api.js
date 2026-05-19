import api from './axios.js'

export const createStory = async (payload) => {
  const res = await api.post('/stories/create', payload)
  return res.data.data
}

export const getFeed = async () => {
  const res = await api.get('/stories/feed')
  return res.data.data
}

export const getUserStories = async (id) => {
  const res = await api.get(`/stories/user/${id}`)
  return res.data.data
}

export const viewStory = async (storyId) => {
  const res = await api.put(`/stories/view/${storyId}`)
  return res.data.data
}

export const deleteStory = async (storyId) => {
  const res = await api.delete(`/stories/${storyId}`)
  return res.data.data
}

export const likeStory = async (storyId) => {
  const res = await api.post(`/stories/${storyId}/like`)
  return res.data.data
}

export const unlikeStory = async (storyId) => {
  const res = await api.delete(`/stories/${storyId}/like`)
  return res.data.data
}
