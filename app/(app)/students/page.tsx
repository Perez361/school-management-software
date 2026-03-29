// app/(app)/students/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Search, UserCircle } from 'lucide-react'

export default async function StudentsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; class?: string }>
}) {
  const { q: qParam, class: classParam } = await searchParams

  const query = qParam || ''
  const classFilter = classParam ? parseInt(classParam) : undefined

  const [students, classes] = await Promise.all([
    prisma.student.findMany({
      where: {
        AND: [
          query ? { name: { contains: query } } : {},
          classFilter ? { classId: classFilter } : {},
        ]
      },
      include: { class: true, parent: true },
      orderBy: { name: 'asc' },
    }),
    prisma.class.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="text-sm text-slate-500 mt-0.5">{students.length} students enrolled</p>
        </div>
        <Link href="/students/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Student
        </Link>
      </div>

      <div className="p-6 space-y-4">
        <div className="card p-4 flex gap-4">
          <form className="flex gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search students..."
                className="input pl-9"
              />
            </div>
            <select name="class" defaultValue={classParam || ''} className="input w-44">
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="submit" className="btn-primary">Filter</button>
            <Link href="/students" className="btn-secondary">Clear</Link>
          </form>
        </div>

        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>ID</th>
                  <th>Class</th>
                  <th>Gender</th>
                  <th>Parent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
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
                    <td><span className="badge badge-blue">{s.class.name}</span></td>
                    <td className="text-slate-500">{s.gender}</td>
                    <td className="text-slate-500">{s.parent?.name || '—'}</td>
                    <td>
                      <div className="flex gap-2">
                        <Link href={`/students/${s.id}`} className="text-xs text-brand-600 hover:underline font-medium">View</Link>
                        <Link href={`/students/${s.id}/edit`} className="text-xs text-slate-500 hover:underline">Edit</Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
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