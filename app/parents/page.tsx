// src/app/parents/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, UserCheck } from 'lucide-react'

export default async function ParentsPage() {
  const parents = await prisma.parent.findMany({
    include: { students: { include: { class: true } } },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-header">
        <div>
          <h1 className="page-title">Parents & Guardians</h1>
          <p className="text-sm text-slate-500">{parents.length} registered parents</p>
        </div>
        <Link href="/parents/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Parent
        </Link>
      </div>

      <div className="p-6">
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Children</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parents.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-xs shrink-0">
                          {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-slate-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="text-slate-600">{p.phone}</td>
                    <td className="text-slate-500 text-xs">{p.email || '—'}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {p.students.map(s => (
                          <span key={s.id} className="badge badge-blue text-xs">
                            {s.name.split(' ')[0]} ({s.class.name})
                          </span>
                        ))}
                        {p.students.length === 0 && <span className="text-slate-400 text-xs">No children linked</span>}
                      </div>
                    </td>
                    <td className="text-slate-500 text-sm">{p.address || '—'}</td>
                    <td>
                      <Link href={`/parents/${p.id}/edit`} className="text-xs text-brand-600 hover:underline font-medium">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
                {parents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      No parents registered yet.
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
