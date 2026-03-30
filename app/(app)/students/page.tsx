'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Search, UserCircle } from 'lucide-react'
import { api, Student, Class } from '@/lib/tauri'

export default function StudentsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

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
    <div className="min-h-screen bg-slate-50">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="text-sm text-slate-500 mt-0.5">{students.length} students enrolled</p>
        </div>
        <Link href="/students/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Student
        </Link>
      </div>

      <div className="p-6 space-y-4">
        <div className="card p-4 flex gap-4">
          <form className="flex gap-4 flex-1" onSubmit={handleFilter}>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input name="q" defaultValue={query} placeholder="Search students..." className="input pl-9" />
            </div>
            <select name="class" defaultValue={classFilter} className="input w-44">
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button type="submit" className="btn-primary">Filter</button>
            <button type="button" onClick={() => { setQuery(''); setClassFilter('') }} className="btn-secondary">Clear</button>
          </form>
        </div>

        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th><th>ID</th><th>Class</th><th>Gender</th><th>Parent</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">Loading…</td></tr>
                ) : students.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-xs shrink-0">
                          {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-slate-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-slate-500">{s.studentId}</td>
                    <td><span className="badge badge-blue">{s.class?.name}</span></td>
                    <td className="text-slate-500">{s.gender}</td>
                    <td className="text-slate-500">{s.parent?.name || '—'}</td>
                    <td>
                      <div className="flex gap-2">
                        <Link href={`/students/detail?id=${s.id}`} className="text-xs text-brand-600 hover:underline font-medium">View</Link>
                        <Link href={`/students/edit?id=${s.id}`} className="text-xs text-slate-500 hover:underline">Edit</Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && students.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      <UserCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      No students found. <Link href="/students/new" className="text-brand-600 hover:underline">Add one?</Link>
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
