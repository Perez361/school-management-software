// app/(app)/parents/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, UserCheck, Phone, Mail, MapPin } from 'lucide-react'

export default async function ParentsPage() {
  const parents = await prisma.parent.findMany({
    include: { students: { include: { class: true } } },
    orderBy: { name: 'asc' },
  })

  const withChildren = parents.filter(p => p.students.length > 0).length
  const withEmail = parents.filter(p => p.email).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      <div style={{
        padding: '28px 32px 24px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
            <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>People</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>
            Parents & Guardians
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
            <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)' }}>{parents.length} registered</span>
            <span style={{ fontFamily: 'system-ui', fontSize: 11, color: '#15803d', background: 'rgba(22,163,74,0.07)', padding: '2px 9px', borderRadius: 20, fontWeight: 600 }}>
              {withChildren} with linked children
            </span>
            <span style={{ fontFamily: 'system-ui', fontSize: 11, color: '#1d4ed8', background: 'rgba(37,99,235,0.07)', padding: '2px 9px', borderRadius: 20, fontWeight: 600 }}>
              {withEmail} with email
            </span>
          </div>
        </div>
        <Link href="/parents/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '10px 20px', background: 'var(--navy)', color: '#faf7f0',
          borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600,
          textDecoration: 'none', boxShadow: '0 2px 10px rgba(15,31,61,0.2)',
        }}>
          <Plus size={15} /> Add Parent
        </Link>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'system-ui' }}>
              <thead>
                <tr style={{ background: 'var(--gold-pale)', borderBottom: '1px solid var(--border)' }}>
                  {['Parent / Guardian', 'Contact', 'Children', 'Address', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '11px 18px', textAlign: 'left',
                      fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)',
                      letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parents.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < parents.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, color: '#15803d', flexShrink: 0,
                        }}>
                          {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{p.name}</div>
                          {p.students.length > 0 && (
                            <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                              {p.students.length} {p.students.length === 1 ? 'child' : 'children'} enrolled
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Phone size={11} color="var(--text-muted)" />
                          <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)' }}>{p.phone}</span>
                        </div>
                        {p.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Mail size={11} color="var(--text-muted)" />
                            <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>{p.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      {p.students.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {p.students.map(s => (
                            <span key={s.id} style={{
                              background: 'rgba(37,99,235,0.07)', color: '#1d4ed8',
                              fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                              whiteSpace: 'nowrap',
                            }}>
                              {s.name.split(' ')[0]} · {s.class.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No children linked</span>
                      )}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      {p.address ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MapPin size={11} color="var(--text-muted)" />
                          <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <Link href={`/parents/${p.id}/edit`} style={{
                        fontSize: 12, fontWeight: 600, color: '#0f1f3d',
                        background: 'rgba(15,31,61,0.06)', padding: '4px 12px',
                        borderRadius: 7, textDecoration: 'none', border: '1px solid rgba(15,31,61,0.1)',
                      }}>Edit</Link>
                    </td>
                  </tr>
                ))}
                {parents.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                      <UserCheck size={44} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.25 }} />
                      <div style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 500, marginBottom: 16 }}>No parents registered yet</div>
                      <Link href="/parents/new" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '9px 18px', background: 'var(--navy)', color: '#faf7f0',
                        borderRadius: 9, textDecoration: 'none', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600,
                      }}><Plus size={13} /> Add First Parent</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}