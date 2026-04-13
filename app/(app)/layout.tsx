'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Sidebar from '@/components/layout/Sidebar'
import { LiveDataProvider } from '@/lib/live-data'
import { NotificationsProvider } from '@/lib/notifications-context'
import NotificationPanel from '@/components/layout/NotificationPanel'

const DEMO_ENABLED = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isDemo, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--cream)' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: 'var(--navy)', opacity: 0.5 }}>Loading…</div>
      </div>
    )
  }

  return (
    <div className="app-shell" style={{ flexDirection: 'column' }}>
      {DEMO_ENABLED && isDemo && (
        <div style={{
          background: 'linear-gradient(90deg, #7a5200, #a07020, #7a5200)',
          color: '#fef3c7',
          fontSize: 'clamp(11px,2.5vw,13px)',
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 600,
          padding: '7px clamp(12px,3vw,20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexShrink: 0,
          zIndex: 200,
          letterSpacing: '0.01em',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Demo Mode — read-only, no data saved
            </span>
          </div>
          <button
            onClick={() => { logout(); router.push('/') }}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#fef3c7',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'system-ui, sans-serif',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            Exit Demo
          </button>
        </div>
      )}
      {/*
        On mobile the sidebar turns into a fixed drawer (CSS handles it).
        The mobile-topbar inside Sidebar renders as a sticky bar at the top of main-content.
        On desktop the sidebar sits as a flex child side-by-side with main-content.
      */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <NotificationsProvider>
          <Sidebar />
          <main className="main-content">
            <LiveDataProvider>
              {children}
            </LiveDataProvider>
          </main>
          <NotificationPanel />
        </NotificationsProvider>
      </div>
    </div>
  )
}