'use client'
/**
 * lib/notifications-context.tsx
 *
 * Fetches system notifications (absent students, outstanding fees, poor
 * performance) and makes them available app-wide. Dismissed notification IDs
 * are persisted in localStorage so they survive page reloads, but
 * automatically expire once the underlying data changes (because IDs encode
 * current data, e.g. balance amount or absence date).
 */

import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, type ReactNode,
} from 'react'
import { api, AppNotification } from '@/lib/api'

const DISMISSED_KEY = 'sms_dismissed_notifs'
const POLL_MS = 5 * 60 * 1000  // re-fetch every 5 minutes

interface NotificationsCtx {
  notifications:    AppNotification[]  // all (not dismissed)
  unreadCount:      number
  panelOpen:        boolean
  openPanel:        () => void
  closePanel:       () => void
  dismiss:          (id: string) => void
  dismissAll:       () => void
  refresh:          () => void
  loading:          boolean
}

const Ctx = createContext<NotificationsCtx | null>(null)

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveDismissed(ids: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]))
  } catch { /* ignore */ }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [all, setAll]               = useState<AppNotification[]>([])
  const [dismissed, setDismissed]   = useState<Set<string>>(new Set())
  const [loading, setLoading]       = useState(false)
  const [panelOpen, setPanelOpen]   = useState(false)
  const timerRef                    = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNotifs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getNotifications()
      setAll(data)
      // Prune dismissed IDs that no longer appear in fresh data
      // (keeps localStorage from growing unbounded)
      setDismissed(prev => {
        const currentIds = new Set(data.map(n => n.id))
        const pruned = new Set([...prev].filter(id => currentIds.has(id)))
        if (pruned.size !== prev.size) saveDismissed(pruned)
        return pruned
      })
    } catch { /* silent — network may be offline */ }
    finally { setLoading(false) }
  }, [])

  // Load dismissed from localStorage on mount and start polling
  useEffect(() => {
    setDismissed(getDismissed())
    fetchNotifs()
    timerRef.current = setInterval(fetchNotifs, POLL_MS)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [fetchNotifs])

  const visible = all.filter(n => !dismissed.has(n.id))

  function dismiss(id: string) {
    setDismissed(prev => {
      const next = new Set(prev)
      next.add(id)
      saveDismissed(next)
      return next
    })
  }

  function dismissAll() {
    setDismissed(prev => {
      const next = new Set(prev)
      visible.forEach(n => next.add(n.id))
      saveDismissed(next)
      return next
    })
  }

  return (
    <Ctx.Provider value={{
      notifications: visible,
      unreadCount:   visible.length,
      panelOpen,
      openPanel:  () => setPanelOpen(true),
      closePanel: () => setPanelOpen(false),
      dismiss,
      dismissAll,
      refresh:    fetchNotifs,
      loading,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider')
  return ctx
}
