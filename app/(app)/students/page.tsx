'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, Search, UserCircle } from 'lucide-react'
import { api, Student, Class } from '@/lib/api'

export default function StudentsPage() {
  const searchParams = useSearchParams()

  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [classFilter, setClassFilter] = useState(searchParams.get('class') ?? '')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, c] = await Promise.all([
        api.getStudents({
          q: query || undefined,
          classId: classFilter ? parseInt(classFilter) : undefined,
        }),
        api.getClasses(),
      ])
      setStudents(s)
      setClasses(c)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [query, classFilter])

  useEffect(() => { load() }, [load])

  function handleFilter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setQuery(fd.get('q') as string ?? '')
    setClassFilter(fd.get('class') as string ?? '')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Header */}
      <div style={{ padding: '28px 32px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
            <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>People</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Students</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
            <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)' }}>
              {students.length} student{students.length !== 1 ? 's' : ''} enrolled
            </span>
          </div>
        </div>
        <Link href="/students/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: 'var(--navy)', color: 'var(--gold-pale)', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, textDecoration: 'none', boxShadow: '0 2px 10px rgba(139,26,26,0.2)' }}>
          <Plus size={15} /> Add Student
        </Link>
      </div>

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Search & Filter */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px' }}>
          <form onSubmit={handleFilter} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Search</label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search by name…"
                  style={{ width: '100%', padding: '9px 13px 9px 36px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Class</label>
              <select name="class" defaultValue={classFilter} style={{ padding: '9px 13px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none', width: 160, cursor: 'pointer' }}>
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button type="submit" style={{ padding: '9px 20px', background: 'var(--navy)', color: 'var(--gold-pale)', border: 'none', borderRadius: 9, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Search</button>
            <button type="button" onClick={() => { setQuery(''); setClassFilter('') }} style={{ padding: '9px 16px', background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 9, fontFamily: 'system-ui', fontSize: 13, cursor: 'pointer' }}>Clear</button>
          </form>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'system-ui' }}>
              <thead>
                <tr style={{ background: 'var(--gold-pale)', borderBottom: '1px solid var(--border)' }}>
                  {['Student', 'ID', 'Class', 'Gender', 'Parent', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                      <td style={{ padding: '13px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <div className="skeleton skeleton-avatar" style={{ width: 34, height: 34, flexShrink: 0 }} />
                          <div className="skeleton skeleton-text" style={{ width: 130 }} />
                        </div>
                      </td>
                      <td style={{ padding: '13px 18px' }}><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
                      <td style={{ padding: '13px 18px' }}><div className="skeleton skeleton-text" style={{ width: 70 }} /></td>
                      <td style={{ padding: '13px 18px' }}><div className="skeleton skeleton-text" style={{ width: 50 }} /></td>
                      <td style={{ padding: '13px 18px' }}><div className="skeleton skeleton-text" style={{ width: 100 }} /></td>
                      <td style={{ padding: '13px 18px' }}><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
                    </tr>
                  ))
                ) : students.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: i < students.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--gold-pale)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, color: 'var(--navy)', flexShrink: 0 }}>
                          {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <span className="mono-tag">{s.studentId}</span>
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <span className="badge badge-blue">{s.class?.name}</span>
                    </td>
                    <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>{s.gender}</td>
                    <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {s.parent?.name || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link href={`/students/detail?id=${s.id}`} className="action-link">View</Link>
                        <Link href={`/students/edit?id=${s.id}`} className="action-link-ghost">Edit</Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && students.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-icon-wrap">
                          <UserCircle size={24} color="var(--gold)" />
                        </div>
                        <div className="empty-title">No students found</div>
                        <div className="empty-desc">Try adjusting your search or add a new student</div>
                        <Link href="/students/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--navy)', color: 'var(--gold-pale)', borderRadius: 9, textDecoration: 'none', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600 }}>
                          <Plus size={13} /> Add Student
                        </Link>
                      </div>
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
