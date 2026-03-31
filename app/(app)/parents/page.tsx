'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, UserCheck, Phone, Mail, MapPin } from 'lucide-react'
import { api, Parent } from '@/lib/api'
import Pagination from '@/components/Pagination'

const PAGE_SIZE = 15

export default function ParentsPage() {
  const [parents, setParents]   = useState<Parent[]>([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)

  useEffect(() => {
    api.getParents().then(setParents).finally(() => setLoading(false))
  }, [])

  const totalPages = Math.ceil(parents.length / PAGE_SIZE)
  const paged = parents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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

      <div style={{ padding: 'clamp(12px,3vw,24px) clamp(16px,4vw,32px)' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'system-ui' }}>
              <thead>
                <tr style={{ background: 'var(--gold-pale)', borderBottom: '1px solid var(--border)' }}>
                  {['Parent / Guardian', 'Contact', 'Address', 'Actions'].map(h => (
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
                      <td style={{ padding: '13px 18px' }}><div className="skeleton skeleton-text" style={{ width: 160 }} /></td>
                      <td style={{ padding: '13px 18px' }}><div className="skeleton skeleton-text skeleton-btn" style={{ width: 60, height: 28 }} /></td>
                    </tr>
                  ))
                ) : paged.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < paged.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, color: '#15803d', flexShrink: 0 }}>
                          {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={11} color="var(--text-muted)" /><span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)' }}>{p.phone}</span></div>
                        {p.email && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={11} color="var(--text-muted)" /><span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>{p.email}</span></div>}
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      {p.address
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={11} color="var(--text-muted)" /><span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)' }}>{p.address}</span></div>
                        : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <Link href={`/parents/edit?id=${p.id}`} className="action-link">Edit</Link>
                    </td>
                  </tr>
                ))}
                {!loading && parents.length === 0 && (
                  <tr><td colSpan={4}>
                    <div className="empty-state">
                      <div className="empty-icon-wrap"><UserCheck size={24} color="var(--gold)" /></div>
                      <div className="empty-title">No parents registered yet</div>
                      <Link href="/parents/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--navy)', color: 'var(--gold-pale)', borderRadius: 9, textDecoration: 'none', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600 }}><Plus size={13} /> Add First Parent</Link>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} totalItems={parents.length} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      </div>
    </div>
  )
}
