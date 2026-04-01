'use client'
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'

interface LiveDataContextValue {
  /** Increments every poll interval and on manual bump. Subscribe to re-fetch data. */
  version: number
  /** Call after a local write to trigger an immediate refresh for all subscribers. */
  bump: () => void
}

const LiveDataContext = createContext<LiveDataContextValue>({ version: 0, bump: () => {} })

const POLL_INTERVAL_MS = 8_000

export function LiveDataProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const bump = useCallback(() => setVersion(v => v + 1), [])

  useEffect(() => {
    timerRef.current = setInterval(bump, POLL_INTERVAL_MS)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [bump])

  return (
    <LiveDataContext.Provider value={{ version, bump }}>
      {children}
    </LiveDataContext.Provider>
  )
}

export function useLiveData() {
  return useContext(LiveDataContext)
}
