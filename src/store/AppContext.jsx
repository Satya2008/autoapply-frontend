import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, publicApi } from '../services/api'

const AppContext = createContext(null)

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}

let toastId = 0

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [config, setConfig] = useState({ appName: 'AutoApply AI' })
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toast = useCallback((message, tone = 'info') => {
    const id = ++toastId
    setToasts((current) => [...current, { id, message, tone }])
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4200)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const loadProfile = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setUser(null)
      return null
    }
    try {
      const profile = await authApi.profile()
      setUser(profile)
      return profile
    } catch {
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        setConfig(await publicApi.config())
      } catch {
        // the API may not be up yet; branding falls back to defaults
      }
      await loadProfile()
      setLoading(false)
    })()
  }, [loadProfile])

  const signIn = useCallback(
    async (credentials) => {
      const auth = await authApi.login(credentials)
      localStorage.setItem('token', auth.token)
      localStorage.setItem('refreshToken', auth.refreshToken)
      const profile = await loadProfile()
      return profile
    },
    [loadProfile],
  )

  const signUp = useCallback(
    async (payload) => {
      const auth = await authApi.register(payload)
      localStorage.setItem('token', auth.token)
      localStorage.setItem('refreshToken', auth.refreshToken)
      return loadProfile()
    },
    [loadProfile],
  )

  const signOut = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // signing out locally matters more than the server round trip
    }
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      setUser,
      config,
      loading,
      theme,
      setTheme,
      toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
      isAdmin: Boolean(user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')),
      isSuperAdmin: user?.role === 'SUPER_ADMIN',
      signIn,
      signUp,
      signOut,
      refreshProfile: loadProfile,
      toast,
      toasts,
      dismissToast,
    }),
    [user, config, loading, theme, signIn, signUp, signOut, loadProfile, toast, toasts, dismissToast],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
