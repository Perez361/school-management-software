// src/app/classes/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, BookOpen } from 'lucide-react'

export default async function ClassesPage() {
  const classes = await prisma.class.findMany({
    include: {
      _count: { select: { students: true } },
      staff: { where: { classId: { not: null } }, take: 1 },
      subjects: { include: { subject: true } },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-header">
        <div>
          <h1 className="page-title">Classes</h1>
          <p className="text-sm text-slate-500">{classes.length} classes configured</p>
        </div>
        <Link href="/classes/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Class
        </Link>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-3 gap-4">
          {classes.map(c => (
            <div key={c.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-brand-600" />
                </div>
                <span className="badge badge-blue">{c.level}</span>
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">{c.name}</h3>
              {c.staff[0] && (
                <p className="text-xs text-slate-500 mt-1">Class Teacher: {c.staff[0].name}</p>
              )}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-brand-600">{c._count.students}</p>
                  <p className="text-xs text-slate-400">students</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700">{c.subjects.length}</p>
                  <p className="text-xs text-slate-400">subjects</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={`/students?class=${c.id}`} className="btn-secondary text-xs py-1.5 flex-1 text-center">
                  View Students
                </Link>
                <Link href={`/results?classId=${c.id}`} className="btn-secondary text-xs py-1.5 flex-1 text-center">
                  Results
                </Link>
              </div>
            </div>
          ))}
          {classes.length === 0 && (
            <div className="col-span-3 card p-12 text-center text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No classes created yet.</p>
              <Link href="/classes/new" className="btn-primary mt-4 inline-flex">Create First Class</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
