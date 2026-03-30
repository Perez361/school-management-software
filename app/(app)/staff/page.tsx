'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, UserSquare2 } from 'lucide-react'
import { api, Staff } from '@/lib/tauri'

const roleMeta: Record<string, { color: string; bg: string; dot: string }> = {
  Teacher:    { color: '#1d4ed8', bg: 'rgba(37,99,235,0.07)',  dot: '#2563eb' },
  Admin:      { color: '#b45309', bg: 'rgba(217,119,6,0.07)',  dot: '#d97706' },
  Headmaster: { color: '#15803d', bg: 'rgba(22,163,74,0.07)',  dot: '#16a34a' },
  Bursar:     { color: '#7c3aed', bg: 'rgba(124,58,237,0.07)', dot: '#8b5cf6' },
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getStaff().then(setStaff).finally(() => setLoading(false))
  }, [])

  const roleCounts = staff.reduce((acc, s) => {
    acc[s.role] = (acc[s.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ padding: '28px 32px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
            <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>People</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Staff</h1>
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
        <Link href="/staff/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: 'var(--navy)', color: '#faf7f0', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, textDecoration: 'none', boxShadow: '0 2px 10px rgba(15,31,61,0.2)' }}>
          <Plus size={15} /> Add Staff
        </Link>
      </div>

      <div style={{ padding: '24px 32px' }}>
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
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</td></tr>
                ) : staff.map((s, i) => {
                  const m = roleMeta[s.role] || { color: '#555', bg: '#f5f5f5', dot: '#888' }
                  return (
                    <tr key={s.id} style={{ borderBottom: i < staff.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                      <td style={{ padding: '13px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, color: m.color, flexShrink: 0 }}>
                            {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{s.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 18px' }}><span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '3px 8px', borderRadius: 5 }}>{s.staffId}</span></td>
                      <td style={{ padding: '13px 18px' }}><span style={{ background: m.bg, color: m.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: m.dot }} />{s.role}</span></td>
                      <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>{s.subject || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td style={{ padding: '13px 18px' }}>
                        {s.class ? <span style={{ background: 'rgba(22,163,74,0.07)', color: '#15803d', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{s.class.name}</span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic' }}>Not assigned</span>}
                      </td>
                      <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>{s.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td style={{ padding: '13px 18px' }}><Link href={`/staff/edit?id=${s.id}`} style={{ fontSize: 12, fontWeight: 600, color: '#0f1f3d', background: 'rgba(15,31,61,0.06)', padding: '4px 12px', borderRadius: 7, textDecoration: 'none', border: '1px solid rgba(15,31,61,0.1)' }}>Edit</Link></td>
                    </tr>
                  )
                })}
                {!loading && staff.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <UserSquare2 size={44} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.25 }} />
                    <div style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 500, marginBottom: 16 }}>No staff members yet</div>
                    <Link href="/staff/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--navy)', color: '#faf7f0', borderRadius: 9, textDecoration: 'none', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600 }}><Plus size={13} /> Add First Staff Member</Link>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
