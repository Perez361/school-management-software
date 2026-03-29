// src/app/staff/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, UserSquare2 } from 'lucide-react'

export default async function StaffPage() {
  const staff = await prisma.staff.findMany({
    include: { class: true },
    orderBy: { name: 'asc' },
  })

  const roleColor: Record<string, string> = {
    Teacher:    'badge-blue',
    Admin:      'badge-amber',
    Headmaster: 'badge-green',
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff</h1>
          <p className="text-sm text-slate-500">{staff.length} staff members</p>
        </div>
        <Link href="/staff/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Staff
        </Link>
      </div>

      <div className="p-6">
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Staff ID</th>
                  <th>Role</th>
                  <th>Subject</th>
                  <th>Class Teacher Of</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-xs shrink-0">
                          {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-slate-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-slate-500">{s.staffId}</td>
                    <td>
                      <span className={`badge ${roleColor[s.role] || 'badge-blue'}`}>{s.role}</span>
                    </td>
                    <td className="text-slate-600">{s.subject || '—'}</td>
                    <td>
                      {s.class ? (
                        <span className="badge badge-green">{s.class.name}</span>
                      ) : (
                        <span className="text-slate-400 text-xs">Not assigned</span>
                      )}
                    </td>
                    <td className="text-slate-500">{s.phone || '—'}</td>
                    <td>
                      <Link href={`/staff/${s.id}/edit`} className="text-xs text-brand-600 hover:underline font-medium">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <UserSquare2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      No staff members yet.
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
