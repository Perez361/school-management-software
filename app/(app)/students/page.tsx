'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, Search, UserCircle, Trash2 } from 'lucide-react'
import { api, Student, Class } from '@/lib/api'
import { toTitleCase } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { useLiveData } from '@/lib/live-data'
import Pagination from '@/components/Pagination'

const PAGE_SIZE = 15

export default function StudentsPage() {
  const { can } = useAuth()
  const { version, bump } = useLiveData()
  const searchParams = useSearchParams()
  const [students, setStudents]       = useState<Student[]>([])
  const [classes, setClasses]         = useState<Class[]>([])
  const [loading, setLoading]         = useState(true)
  const [query, setQuery]             = useState(searchParams.get('q') ?? '')
  const [classFilter, setClassFilter] = useState(searchParams.get('class') ?? '')
  const [page, setPage]               = useState(1)
  const [deleting, setDeleting]       = useState<number | null>(null)
  const [confirmId, setConfirmId]     = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, c] = await Promise.all([
        api.getStudents({ q: query || undefined, classId: classFilter ? parseInt(classFilter) : undefined }),
        api.getClasses(),
      ])
      setStudents(s); setClasses(c)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [query, classFilter, version])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: number) {
    setDeleting(id)
    try {
      await api.deleteStudent(id)
      setStudents(prev => prev.filter(s => s.id !== id))
      bump()
    } finally {
      setDeleting(null)
      setConfirmId(null)
    }
  }


  const totalPages = Math.ceil(students.length / PAGE_SIZE)
  const paged = students.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      <div style={{ padding: 'clamp(16px,4vw,28px) clamp(16px,4vw,32px) clamp(14px,3vw,24px)', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
            <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>People</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Students</h1>
          <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)' }}>{students.length} student{students.length !== 1 ? 's' : ''} enrolled</span>
        </div>
        {can('students:write') && (
          <Link href="/students/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'var(--navy)', color: 'var(--gold-pale)', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            <Plus size={15} /> Add Student
          </Link>
        )}
      </div>

      <div style={{ padding: 'clamp(12px,3vw,24px) clamp(16px,4vw,32px)', display: 'flex', flexDirection: 'column', gap: 'clamp(10px,2vw,16px)' }}>

        {/* Search & Filter */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 'clamp(12px,2vw,16px) clamp(14px,3vw,20px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Search</label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  value={query}
                  onChange={e => { setQuery(e.target.value); setPage(1) }}
                  placeholder="Type to search by name…"
                  style={{ width: '100%', padding: '9px 13px 9px 36px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Class</label>
              <select
                value={classFilter}
                onChange={e => { setClassFilter(e.target.value); setPage(1) }}
                style={{ width: '100%', padding: '9px 13px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {(query || classFilter) && (
              <div>
                <button onClick={() => { setQuery(''); setClassFilter(''); setPage(1) }} style={{ width: '100%', padding: '9px 14px', background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 9, fontFamily: 'system-ui', fontSize: 13, cursor: 'pointer' }}>Clear</button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'system-ui', minWidth: 480 }}>
              <thead>
                <tr style={{ background: 'var(--gold-pale)', borderBottom: '1px solid var(--border)' }}>
                  {['Student','ID','Class','Gender','Parent','Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                      <td style={{ padding: '12px 14px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="skeleton skeleton-avatar" style={{ width: 32, height: 32, flexShrink: 0 }} /><div className="skeleton skeleton-text" style={{ width: 120 }} /></div></td>
                      {[80,70,50,100,80].map((w,j) => <td key={j} style={{ padding: '12px 14px' }}><div className="skeleton skeleton-text" style={{ width: w }} /></td>)}
                    </tr>
                  ))
                ) : paged.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: i < paged.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold-pale)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', fontSize: 10, fontWeight: 700, color: 'var(--navy)', flexShrink: 0 }}>
                          {toTitleCase(s.name).split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>{toTitleCase(s.name)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}><span className="mono-tag">{s.studentId}</span></td>
                    <td style={{ padding: '12px 14px' }}><span className="badge badge-blue">{s.class?.name}</span></td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{s.gender}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{s.parent ? toTitleCase(s.parent.name) : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Link href={`/students/detail?id=${s.id}`} className="action-link">View</Link>
                        <Link href={`/students/edit?id=${s.id}`} className="action-link-ghost">Edit</Link>
                        {confirmId === s.id ? (
                          <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 3 }}>
                            <span style={{ fontFamily: 'system-ui', fontSize: 10, color: '#b91c1c', fontWeight: 600, maxWidth: 180 }}>Deletes all results, attendance & billing records.</span>
                            <span style={{ display: 'inline-flex', gap: 5 }}>
                              <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id} style={{ fontSize: 11, padding: '3px 9px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>{deleting === s.id ? '…' : 'Delete'}</button>
                              <button onClick={() => setConfirmId(null)} style={{ fontSize: 11, padding: '3px 9px', background: 'var(--border)', color: 'var(--text-secondary)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                            </span>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmId(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 4, display: 'flex', alignItems: 'center' }} title="Delete"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && students.length === 0 && (
                  <tr><td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-icon-wrap"><UserCircle size={24} color="var(--gold)" /></div>
                      <div className="empty-title">No students found</div>
                      <div className="empty-desc">Try adjusting your search or add a new student</div>
                      {can('students:write') && <Link href="/students/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--navy)', color: 'var(--gold-pale)', borderRadius: 9, textDecoration: 'none', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600 }}><Plus size={13} /> Add Student</Link>}
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} totalItems={students.length} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      </div>
    </div>
  )
}
