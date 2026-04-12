'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, UserSquare2, Trash2, Search } from 'lucide-react'
import { api, Staff } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useLiveData } from '@/lib/live-data'
import Pagination from '@/components/Pagination'

const PAGE_SIZE = 15

const roleMeta: Record<string, { color: string; bg: string; dot: string }> = {
  Teacher:    { color: 'var(--navy)', bg: 'rgba(139,26,26,0.07)',  dot: 'var(--gold)' },
  Admin:      { color: '#b45309', bg: 'rgba(217,119,6,0.07)',  dot: '#d97706' },
  Headmaster: { color: '#15803d', bg: 'rgba(22,163,74,0.07)',  dot: '#16a34a' },
  Bursar:     { color: '#8B1A1A', bg: 'rgba(139,26,26,0.07)', dot: '#C9A84C' },
}

export default function StaffPage() {
  const { can } = useAuth()
  const { version, bump } = useLiveData()
  const router = useRouter()
  useEffect(() => { if (!can('staff')) router.replace('/dashboard') }, [can, router])

  const [staff, setStaff]       = useState<Staff[]>([])
  const [loading, setLoading]   = useState(true)
  const [query, setQuery]       = useState('')
  const [page, setPage]         = useState(1)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)

  useEffect(() => {
    api.getStaff().then(setStaff).finally(() => setLoading(false))
  }, [version])

  async function handleDelete(id: number) {
    setDeleting(id)
    try {
      await api.deleteStaff(id)
      setStaff(prev => prev.filter(s => s.id !== id))
      bump()
    } finally {
      setDeleting(null)
      setConfirmId(null)
    }
  }

  const roleCounts = staff.reduce((acc, s) => {
    acc[s.role] = (acc[s.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const filtered = query.trim()
    ? staff.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.role.toLowerCase().includes(query.toLowerCase()) || (s.subject ?? '').toLowerCase().includes(query.toLowerCase()))
    : staff
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ padding: 'clamp(16px,4vw,28px) clamp(16px,4vw,32px) clamp(14px,3vw,24px)', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
            <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>People</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Staff</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)' }}>{staff.length} members</span>
            {Object.entries(roleCounts).map(([role, count]) => {
              const m = roleMeta[role] || { color: '#555', bg: '#f5f5f5', dot: '#888' }
              return (
                <span key={role} style={{ fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: m.color, background: m.bg, padding: '2px 9px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.dot, display: 'inline-block' }} />
                  {count} {role}{count > 1 ? 's' : ''}
                </span>
              )
            })}
          </div>
        </div>
        <Link href="/staff/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: 'var(--navy)', color: 'var(--gold-pale)', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, textDecoration: 'none', boxShadow: '0 2px 10px rgba(139,26,26,0.2)', whiteSpace: 'nowrap' }}>
          <Plus size={15} /> Add Staff
        </Link>
      </div>

      <div style={{ padding: 'clamp(12px,3vw,24px) clamp(16px,4vw,32px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Search */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 'clamp(12px,2vw,16px) clamp(14px,3vw,20px)' }}>
          <div style={{ position: 'relative', maxWidth: 360 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1) }}
              placeholder="Search by name, role, or subject…"
              style={{ width: '100%', padding: '9px 13px 9px 36px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'system-ui' }}>
              <thead>
                <tr style={{ background: 'var(--gold-pale)', borderBottom: '1px solid var(--border)' }}>
                  {['Staff Member', 'Staff ID', 'Role', 'Subject', 'Class Teacher Of', 'Phone', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3].map(i => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                      <td style={{ padding: '13px 18px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 11 }}><div className="skeleton skeleton-avatar" style={{ width: 34, height: 34, flexShrink: 0 }} /><div className="skeleton skeleton-text" style={{ width: 130 }} /></div></td>
                      <td style={{ padding: '13px 18px' }}><div className="skeleton skeleton-text" style={{ width: 70 }} /></td>
                      <td style={{ padding: '13px 18px' }}><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
                      <td style={{ padding: '13px 18px' }}><div className="skeleton skeleton-text" style={{ width: 100 }} /></td>
                      <td style={{ padding: '13px 18px' }}><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
                      <td style={{ padding: '13px 18px' }}><div className="skeleton skeleton-text" style={{ width: 100 }} /></td>
                      <td style={{ padding: '13px 18px' }}><div className="skeleton skeleton-text skeleton-btn" style={{ width: 60, height: 28 }} /></td>
                    </tr>
                  ))
                ) : paged.map((s, i) => {
                  const m = roleMeta[s.role] || { color: '#555', bg: '#f5f5f5', dot: '#888' }
                  return (
                    <tr key={s.id} style={{ borderBottom: i < paged.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                      <td style={{ padding: '13px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, color: m.color, flexShrink: 0 }}>
                            {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{s.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 18px' }}><span className="mono-tag">{s.staffId}</span></td>
                      <td style={{ padding: '13px 18px' }}><span style={{ background: m.bg, color: m.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: m.dot }} />{s.role}</span></td>
                      <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>{s.subject || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td style={{ padding: '13px 18px' }}>
                        {s.class ? <span className="badge badge-green">{s.class.name}</span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic' }}>Not assigned</span>}
                      </td>
                      <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>{s.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td style={{ padding: '13px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Link href={`/staff/edit?id=${s.id}`} className="action-link">Edit</Link>
                          {confirmId === s.id ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id} style={{ fontSize: 11, padding: '3px 9px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>{deleting === s.id ? '…' : 'Confirm'}</button>
                              <button onClick={() => setConfirmId(null)} style={{ fontSize: 11, padding: '3px 9px', background: 'var(--border)', color: 'var(--text-secondary)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmId(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 4, display: 'flex', alignItems: 'center' }} title="Delete"><Trash2 size={14} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-icon-wrap"><UserSquare2 size={24} color="var(--gold)" /></div>
                      <div className="empty-title">{staff.length === 0 ? 'No staff members yet' : 'No staff match your search'}</div>
                      {staff.length === 0 && <Link href="/staff/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--navy)', color: 'var(--gold-pale)', borderRadius: 9, textDecoration: 'none', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600 }}><Plus size={13} /> Add First Staff Member</Link>}
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      </div>
    </div>
  )
}
