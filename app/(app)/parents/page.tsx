'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, UserCheck, Phone, Mail, MapPin, Trash2, Search } from 'lucide-react'
import { api, Parent } from '@/lib/api'
import { toTitleCase } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { useLiveData } from '@/lib/live-data'
import Pagination from '@/components/Pagination'

const PAGE_SIZE = 15

export default function ParentsPage() {
  const { can } = useAuth()
  const { version, bump } = useLiveData()
  const router = useRouter()
  useEffect(() => { if (!can('parents')) router.replace('/dashboard') }, [can, router])

  const [parents, setParents]     = useState<Parent[]>([])
  const [loading, setLoading]     = useState(true)
  const [query, setQuery]         = useState('')
  const [page, setPage]           = useState(1)
  const [deleting, setDeleting]   = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)

  useEffect(() => {
    api.getParents().then(setParents).catch(() => {}).finally(() => setLoading(false))
  }, [version])

  async function handleDelete(id: number) {
    setDeleting(id)
    try {
      await api.deleteParent(id)
      setParents(prev => prev.filter(p => p.id !== id))
      bump()
    } finally {
      setDeleting(null)
      setConfirmId(null)
    }
  }

  const filtered = query.trim()
    ? parents.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || (p.phone ?? '').includes(query) || (p.email ?? '').toLowerCase().includes(query.toLowerCase()))
    : parents
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
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Parents & Guardians</h1>
          <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)' }}>{parents.length} registered</span>
        </div>
        <Link href="/parents/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: 'var(--navy)', color: 'var(--gold-pale)', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, textDecoration: 'none', boxShadow: '0 2px 10px rgba(139,26,26,0.2)', whiteSpace: 'nowrap' }}>
          <Plus size={15} /> Add Parent
        </Link>
      </div>

      <div style={{ padding: 'clamp(12px,3vw,24px) clamp(16px,4vw,32px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Search */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 'clamp(12px,2vw,16px) clamp(14px,3vw,20px)' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1) }}
              placeholder="Search by name, phone, or email…"
              style={{ width: '100%', padding: '9px 13px 9px 36px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'system-ui', minWidth: 440 }}>
              <thead>
                <tr style={{ background: 'var(--gold-pale)', borderBottom: '1px solid var(--border)' }}>
                  {['Parent / Guardian', 'Contact', 'Students', 'Address', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3].map(i => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                      <td style={{ padding: '13px 18px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 11 }}><div className="skeleton skeleton-avatar" style={{ width: 36, height: 36, flexShrink: 0 }} /><div className="skeleton skeleton-text" style={{ width: 140 }} /></div></td>
                      <td style={{ padding: '13px 18px' }}><div className="skeleton skeleton-text" style={{ width: 120 }} /></td>
                      <td style={{ padding: '13px 18px' }}><div className="skeleton skeleton-text" style={{ width: 40 }} /></td>
                      <td style={{ padding: '13px 18px' }}><div className="skeleton skeleton-text" style={{ width: 160 }} /></td>
                      <td style={{ padding: '13px 18px' }}><div className="skeleton skeleton-text skeleton-btn" style={{ width: 60, height: 28 }} /></td>
                    </tr>
                  ))
                ) : paged.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < paged.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, color: '#15803d', flexShrink: 0 }}>
                          {toTitleCase(p.name).split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{toTitleCase(p.name)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <a href={`tel:${p.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}><Phone size={11} color="var(--text-muted)" /><span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)' }}>{p.phone}</span></a>
                        {p.email && <a href={`mailto:${p.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}><Mail size={11} color="var(--text-muted)" /><span style={{ fontFamily: 'system-ui', fontSize: 11, color: '#2563eb' }}>{p.email}</span></a>}
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 24, height: 24, borderRadius: 12, background: (p.studentCount ?? 0) > 0 ? 'rgba(22,163,74,0.1)' : 'var(--border-soft)', color: (p.studentCount ?? 0) > 0 ? '#15803d' : 'var(--text-muted)', fontFamily: 'system-ui', fontSize: 12, fontWeight: 700, padding: '0 7px' }}>
                        {p.studentCount ?? 0}
                      </span>
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      {p.address
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={11} color="var(--text-muted)" /><span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)' }}>{p.address}</span></div>
                        : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Link href={`/parents/edit?id=${p.id}`} className="action-link">Edit</Link>
                        {confirmId === p.id ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} style={{ fontSize: 11, padding: '3px 9px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>{deleting === p.id ? '…' : 'Confirm'}</button>
                            <button onClick={() => setConfirmId(null)} style={{ fontSize: 11, padding: '3px 9px', background: 'var(--border)', color: 'var(--text-secondary)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmId(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 4, display: 'flex', alignItems: 'center' }} title="Delete"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-icon-wrap"><UserCheck size={24} color="var(--gold)" /></div>
                      <div className="empty-title">{parents.length === 0 ? 'No parents registered yet' : 'No parents match your search'}</div>
                      {parents.length === 0 && <Link href="/parents/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--navy)', color: 'var(--gold-pale)', borderRadius: 9, textDecoration: 'none', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600 }}><Plus size={13} /> Add First Parent</Link>}
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
