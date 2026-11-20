import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(false)

  const signIn = useCallback(async (email, password) => {
    const result = await api.login(email, password)
    const profile = await api.me(result.access_token)
    setToken(result.access_token)
    setUser(profile)
    return profile
  }, [])

  const signOut = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ token, user, checking, signIn, signOut, isAdmin: user?.role === 'admin' }), [token, user, checking, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
