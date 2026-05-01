import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react'
import { fetchMe, loginRequest, logoutRequest, registerRequest, toSignupPayload } from '@/api/auth'
import { getAccessToken, isMockMode } from '@/lib/api-client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [bootstrapping, setBootstrapping] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const me = await fetchMe()
      setUser(me)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!getAccessToken()) {
        setBootstrapping(false)
        return
      }
      try {
        const me = await fetchMe()
        if (!cancelled) setUser(me)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email, password) => {
    await loginRequest(email, password)
    try {
      const me = await fetchMe()
      setUser(me)
    } catch {
      setUser(null)
    }
    setBootstrapping(false)
  }, [])

  const register = useCallback(async (formValues) => {
    const payload = toSignupPayload(formValues)
    await registerRequest(payload)
    if (!isMockMode()) {
      await loginRequest(payload.email, payload.password)
    }
    try {
      const me = await fetchMe()
      setUser(me)
    } catch {
      setUser(null)
    }
    setBootstrapping(false)
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      bootstrapping,
      login,
      register,
      logout,
      refreshUser,
      isAuthenticated: Boolean(user),
    }),
    [user, bootstrapping, login, register, logout, refreshUser],
  )

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
