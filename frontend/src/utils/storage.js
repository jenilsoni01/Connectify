const ACCESS_KEY = 'connectify_access'
const USER_KEY = 'connectify_user'

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY)

export const setAccessToken = (token) => {
  if (token) localStorage.setItem(ACCESS_KEY, token)
  else localStorage.removeItem(ACCESS_KEY)
}

export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export const setStoredUser = (user) => {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}

export const clearAuth = () => {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(USER_KEY)
}
