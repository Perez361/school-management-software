// src/app/students/[id]/page.tsx
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, FileText, Receipt, User } from 'lucide-react'
import { getGrade, getRemark } from '@/lib/grades'

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const student = await prisma.student.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      class: true,
      parent: true,
      results: { include: { subject: true }, orderBy: { term: 'asc' } },
      payments: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!student) notFound()

  const groupedResults: Record<string, typeof student.results> = {}
  for (const r of student.results) {
    const key = `${r.term} ${r.year}`
    if (!groupedResults[key]) groupedResults[key] = []
    groupedResults[key].push(r)
  }

  const totalPaid = student.payments.reduce((s, p) => s + p.paid, 0)
  const totalBalance = student.payments.reduce((s, p) => s + p.balance, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/students" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">{student.name}</h1>
            <p className="text-sm text-slate-500 font-mono">{student.studentId}</p>
          </div>
        </div>
        <Link href={`/students/${student.id}/edit`} className="btn-secondary flex items-center gap-2">
          <Edit className="w-4 h-4" />
          Edit Student
        </Link>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Profile Card */}
          <div className="card p-6">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xl mb-3">
                {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <h2 className="font-display font-bold text-slate-900">{student.name}</h2>
              <span className="badge badge-blue mt-1">{student.class.name}</span>
            </div>

            <div className="space-y-3 text-sm">
              {[
                ['Student ID', student.studentId],
                ['Gender', student.gender],
                ['Date of Birth', new Date(student.dob).toLocaleDateString('en-GH')],
                ['Phone', student.phone || '—'],
                ['Address', student.address || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">{label}</span>
                  <span className="font-medium text-slate-800 text-right">{value}</span>
                </div>
              ))}
            </div>

            {student.parent && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Parent / Guardian</p>
                <p className="font-medium text-slate-800 text-sm">{student.parent.name}</p>
                <p className="text-slate-500 text-xs mt-0.5">{student.parent.phone}</p>
                {student.parent.email && <p className="text-slate-400 text-xs">{student.parent.email}</p>}
              </div>
            )}
          </div>

          {/* Results & Fees */}
          <div className="col-span-2 space-y-4">
            {/* Fee Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-4">
                <p className="text-xs text-slate-500">Total Billed</p>
                <p className="text-xl font-display font-bold text-slate-900 mt-1">
                  GHS {student.payments.reduce((s, p) => s + p.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="card p-4 border-l-4 border-green-400">
                <p className="text-xs text-green-600">Total Paid</p>
                <p className="text-xl font-display font-bold text-slate-900 mt-1">GHS {totalPaid.toLocaleString()}</p>
              </div>
              <div className="card p-4 border-l-4 border-red-400">
                <p className="text-xs text-red-500">Outstanding</p>
                <p className="text-xl font-display font-bold text-slate-900 mt-1">GHS {totalBalance.toLocaleString()}</p>
              </div>
            </div>

            {/* Academic Results */}
            <div className="card">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-500" />
                <h3 className="font-semibold text-sm text-slate-800">Academic Results</h3>
              </div>
              {Object.keys(groupedResults).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No results recorded yet.</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {Object.entries(groupedResults).map(([termYear, results]) => (
                    <div key={termYear} className="p-4">
                      <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">{termYear}</p>
                      <div className="space-y-1.5">
                        {results.map(r => (
                          <div key={r.id} className="flex items-center justify-between">
                            <span className="text-sm text-slate-700">{r.subject.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-400">CA: {r.ca} | Exam: {r.exam}</span>
                              <span className="text-sm font-bold text-slate-800 w-8 text-right">{r.total}</span>
                              <span className={`badge w-6 text-center justify-center text-xs
                                ${r.grade === 'A' ? 'badge-green' :
                                  r.grade === 'B' ? 'badge-blue' :
                                  r.grade === 'F' ? 'badge-red' : 'badge-amber'}`}>
                                {r.grade}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment History */}
            <div className="card">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-green-500" />
                <h3 className="font-semibold text-sm text-slate-800">Payment History</h3>
              </div>
              {student.payments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No payments recorded yet.</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {student.payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{p.feeType}</p>
                        <p className="text-xs text-slate-400">{p.term} · {p.year}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">GHS {p.paid.toFixed(2)}</p>
                        {p.balance > 0 && (
                          <p className="text-xs text-red-500">Bal: GHS {p.balance.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
