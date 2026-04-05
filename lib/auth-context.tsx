'use client'
/**
 * lib/auth-context.tsx
 *
 * Replaces JWT cookie auth with simple localStorage-based session.
 * Tauri desktop apps don't need server-side auth — we store the
 * logged-in user in memory + localStorage and gate navigation client-side.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, User, clearAuthToken } from '@/lib/api'
import { can as canFeature, Feature } from '@/lib/permissions'

const DEMO_ENABLED = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isDemo: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  enterDemo: () => void
  can: (feature: Feature) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'sms_user'
const DEMO_KEY    = 'sms_demo'

const DEMO_USER: User = {
  id: 0,
  username: 'demo',
  email: 'demo@school.edu',
  role: 'Admin',
  name: 'Demo User',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]     = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo]  = useState(false)

  useEffect(() => {
    try {
      if (DEMO_ENABLED) {
        const demo = localStorage.getItem(DEMO_KEY)
        if (demo === '1') {
          setUser(DEMO_USER)
          setIsDemo(true)
          setLoading(false)
          return
        }
      }
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setUser(JSON.parse(stored))
    } catch {}
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    const u = await api.login(email, password)
    setUser(u)
    setIsDemo(false)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    localStorage.removeItem(DEMO_KEY)
    return u
  }

  const logout = () => {
    setUser(null)
    setIsDemo(false)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(DEMO_KEY)
    clearAuthToken()
  }

  const enterDemo = () => {
    if (!DEMO_ENABLED) return
    setUser(DEMO_USER)
    setIsDemo(true)
    localStorage.setItem(DEMO_KEY, '1')
    localStorage.removeItem(STORAGE_KEY)
  }

  const can = (feature: Feature) => canFeature(user?.role, feature)

  return (
    <AuthContext.Provider value={{ user, loading, isDemo, login, logout, enterDemo, can }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
