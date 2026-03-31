'use client'
import { useState, useEffect, useCallback } from 'react'
import { api, SyncStatus } from '@/lib/api'
import { RefreshCw, Cloud, CloudOff } from 'lucide-react'

export default function SyncStatusBar() {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [syncing, setSyncing] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const s = await api.getSyncStatus()
      setStatus(s)
    } catch {
      // silently ignore — not all clients support sync
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [refresh])

  if (!status || !status.enabled) return null

  async function handleSync() {
    setSyncing(true)
    try {
      await api.triggerSync()
      // Poll a few times to pick up updated status
      setTimeout(refresh, 2000)
      setTimeout(refresh, 5000)
    } finally {
      setSyncing(false)
    }
  }

  const lastSync = status.last_pulled_at === '1970-01-01T00:00:00Z'
    ? 'Never'
    : new Date(status.last_pulled_at).toLocaleTimeString()

  return (
    <div style={{
      padding: '8px 10px',
      margin: '0 8px 8px',
      borderRadius: 8,
      background: 'rgba(201,168,76,0.07)',
      border: '1px solid rgba(201,168,76,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}>
      <Cloud size={12} color="#c9a84c" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
          {status.pending > 0
            ? <span style={{ color: '#e8b84b' }}>{status.pending} pending</span>
            : 'Synced'}
          {' · '}{lastSync}
        </div>
      </div>
      <button
        onClick={handleSync}
        disabled={syncing}
        title="Sync now"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 2, color: 'rgba(201,168,76,0.7)', flexShrink: 0,
        }}
      >
        <RefreshCw size={11} style={{ animation: syncing ? 'spin 1s linear infinite' : undefined }} />
      </button>
    </div>
  )
}
