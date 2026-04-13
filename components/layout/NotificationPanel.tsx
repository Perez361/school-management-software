'use client'
import Link from 'next/link'
import { X, RefreshCw, Bell, AlertTriangle, AlertCircle, Info, CheckCircle2, UserX, DollarSign, TrendingDown, UserSquare2, Users, UserCheck } from 'lucide-react'
import { useNotifications } from '@/lib/notifications-context'
import type { AppNotification } from '@/lib/api'

const KIND_META: Record<string, {
  label: string
  icon: React.ReactNode
  color: string
  bg: string
  href: string
}> = {
  absent: {
    label: 'Absences',
    icon:  <UserX size={14} />,
    color: '#b45309',
    bg:    'rgba(180,83,9,0.08)',
    href:  '/attendance',
  },
  fee_owed: {
    label: 'Outstanding Fees',
    icon:  <DollarSign size={14} />,
    color: '#1d4ed8',
    bg:    'rgba(29,78,216,0.08)',
    href:  '/billing',
  },
  poor_performance: {
    label: 'Low Performance',
    icon:  <TrendingDown size={14} />,
    color: '#b91c1c',
    bg:    'rgba(185,28,28,0.08)',
    href:  '/results',
  },
  unassigned_staff: {
    label: 'Unassigned Teachers',
    icon:  <UserSquare2 size={14} />,
    color: '#6b7280',
    bg:    'rgba(107,114,128,0.08)',
    href:  '/staff',
  },
  empty_class: {
    label: 'Empty Classes',
    icon:  <Users size={14} />,
    color: '#6b7280',
    bg:    'rgba(107,114,128,0.08)',
    href:  '/classes',
  },
  no_parent: {
    label: 'No Parent Linked',
    icon:  <UserCheck size={14} />,
    color: '#6b7280',
    bg:    'rgba(107,114,128,0.08)',
    href:  '/students',
  },
}

// Display order — critical first, informational last
const KIND_ORDER = ['absent', 'fee_owed', 'poor_performance', 'unassigned_staff', 'empty_class', 'no_parent'] as const

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'error')   return <AlertCircle   size={14} color="#b91c1c" />
  if (severity === 'warning') return <AlertTriangle size={14} color="#b45309" />
  return                             <Info          size={14} color="#6b7280" />
}

function NotifItem({ n, onDismiss }: { n: AppNotification; onDismiss: () => void }) {
  const meta = KIND_META[n.kind] ?? KIND_META.absent
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-soft)', alignItems: 'flex-start' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: meta.color }}>
        {meta.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <SeverityIcon severity={n.severity} />
          <span style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>{n.title}</span>
        </div>
        <p style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45, wordBreak: 'break-word' }}>{n.body}</p>
        <Link href={meta.href} style={{ display: 'inline-block', marginTop: 5, fontFamily: 'system-ui', fontSize: 11, color: meta.color, fontWeight: 600, textDecoration: 'none' }}>
          View →
        </Link>
      </div>
      <button
        onClick={onDismiss}
        title="Dismiss"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, flexShrink: 0, display: 'flex', alignItems: 'center' }}
      >
        <X size={13} />
      </button>
    </div>
  )
}

export default function NotificationPanel() {
  const { notifications, panelOpen, closePanel, dismiss, dismissAll, refresh, loading } = useNotifications()

  if (!panelOpen) return null

  const grouped = Object.fromEntries(
    KIND_ORDER.map(k => [k, notifications.filter(n => n.kind === k)])
  ) as Record<typeof KIND_ORDER[number], AppNotification[]>

  const kinds = KIND_ORDER.filter(k => grouped[k].length > 0)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closePanel}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1100 }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 'clamp(300px, 90vw, 400px)',
        background: 'var(--surface)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', zIndex: 1101,
        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <Bell size={16} color="var(--gold)" />
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color: 'var(--navy)', flex: 1 }}>
            Notifications
            {notifications.length > 0 && (
              <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 20, height: 20, borderRadius: 10, background: '#dc2626', color: '#fff', fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, padding: '0 5px' }}>
                {notifications.length}
              </span>
            )}
          </span>
          <button
            onClick={refresh}
            disabled={loading}
            title="Refresh"
            style={{ background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 4 }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button
            onClick={closePanel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Summary chips */}
        {notifications.length > 0 && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0, background: 'var(--cream)' }}>
            {kinds.map(k => {
              const meta = KIND_META[k]
              return (
                <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: meta.bg, color: meta.color, fontFamily: 'system-ui', fontSize: 11, fontWeight: 700 }}>
                  {meta.icon} {grouped[k].length} {meta.label}
                </span>
              )
            })}
          </div>
        )}

        {/* Notification list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          {notifications.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--gold-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={24} color="var(--gold)" />
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>All clear!</div>
              <div style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>No absences, fee issues, performance<br/>concerns, or admin gaps detected.</div>
            </div>
          ) : (
            kinds.map(kind => (
              <div key={kind}>
                {/* Section label */}
                <div style={{ position: 'sticky', top: 0, background: 'var(--surface)', padding: '14px 0 6px', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: KIND_META[kind].color }}>{KIND_META[kind].icon}</span>
                    <span style={{ fontFamily: 'system-ui', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {KIND_META[kind].label} ({grouped[kind].length})
                    </span>
                  </div>
                </div>
                {grouped[kind].map(n => (
                  <NotifItem key={n.id} n={n} onDismiss={() => dismiss(n.id)} />
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
            <button
              onClick={dismissAll}
              style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}
            >
              Dismiss all
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}
