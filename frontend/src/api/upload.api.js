import api from './axios.js'

const upload = async (path, file) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post(`/upload/${path}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data.data
}

export const uploadProfile = (file) => upload('profile-pic', file)
export const uploadStory = (file) => upload('story', file)
export const uploadChat = (file) => upload('chat', file)
