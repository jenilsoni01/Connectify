import axios from 'axios'
import { getAccessToken, setAccessToken, clearAuth } from '../utils/storage.js'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

const api = axios.create({
  baseURL,
  withCredentials: true
})

const refreshClient = axios.create({
  baseURL,
  withCredentials: true
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshRes = await refreshClient.post('/auth/refresh')
        const newToken = refreshRes.data?.data?.accessToken
        if (newToken) {
          setAccessToken(newToken)
          original.headers.Authorization = `Bearer ${newToken}`
          return api.request(original)
        }
      } catch {
        clearAuth()
      }
    }
    return Promise.reject(error)
  }
)

export default api
