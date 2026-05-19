import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth.api.js'
import * as userApi from '../api/user.api.js'
import { getAccessToken, getStoredUser, setAccessToken, setStoredUser, clearAuth } from '../utils/storage.js'
import { initializeE2EE } from '../utils/crypto.js'
import toast from 'react-hot-toast'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser())
  const [accessToken, setTokenState] = useState(getAccessToken())
  const [loading, setLoading] = useState(true)
  const [privateKey, setPrivateKey] = useState(null)

  const setSession = useCallback((nextUser, token) => {
    setStoredUser(nextUser)
    setAccessToken(token)
    setUser(nextUser)
    setTokenState(token)
  }, [])

  const clearSession = useCallback(() => {
    clearAuth()
    setUser(null)
    setTokenState(null)
    setPrivateKey(null)
  }, [])

  /* Initialize E2EE keypair after login/register */
  const setupE2EE = useCallback(async () => {
    try {
      const result = await initializeE2EE()
      setPrivateKey(result.privateKey)
      if (result.isNew && result.publicKeyPem) {
        await userApi.updatePublicKey(result.publicKeyPem)
      }
    } catch (err) {
      console.warn('E2EE initialization skipped:', err.message)
    }
  }, [])

  const bootstrap = useCallback(async () => {
    setLoading(true)
    try {
      const token = getAccessToken()
      if (token) {
        try {
          const meRes = await authApi.me()
          setSession(meRes, token)
          await setupE2EE()
          setLoading(false)
          return
        } catch {
          const refreshRes = await authApi.refresh()
          const newToken = refreshRes?.accessToken
          if (newToken) {
            const meRes = await authApi.me()
            setSession(meRes, newToken)
            await setupE2EE()
            setLoading(false)
            return
          }
        }
      }
      const refreshRes = await authApi.refresh()
      const newToken = refreshRes?.accessToken
      if (newToken) {
        const meRes = await authApi.me()
        setSession(meRes, newToken)
        await setupE2EE()
      }
    } catch {
      clearSession()
    } finally {
      setLoading(false)
    }
  }, [setSession, clearSession, setupE2EE])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const login = async (payload) => {
    const res = await authApi.login(payload)
    setSession(res.user, res.accessToken)
    await setupE2EE()
    toast.success('Welcome back')
  }

  const register = async (payload) => {
    const res = await authApi.register(payload)
    setSession(res.user, res.accessToken)
    await setupE2EE()
    toast.success('Account created')
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      clearSession()
      toast.success('Logged out')
    }
  }

  const logoutAll = async () => {
    try {
      await authApi.logoutAll()
    } finally {
      clearSession()
      toast.success('Logged out everywhere')
    }
  }

  const updateProfile = async (payload) => {
    const res = await userApi.updateUser(payload)
    setSession(res, accessToken)
    toast.success('Profile updated')
  }

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      privateKey,
      login,
      register,
      logout,
      logoutAll,
      updateProfile
    }),
    [user, accessToken, loading, privateKey]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
