// app/(app)/billing/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Receipt, AlertCircle, CheckCircle } from 'lucide-react'

export default async function BillingPage({
  searchParams
}: {
  searchParams: Promise<{ classId?: string; term?: string; status?: string }>
}) {
  const { classId: classIdParam, term: termParam, status: statusParam } = await searchParams

  const classId = classIdParam ? parseInt(classIdParam) : undefined
  const term = termParam || ''
  const status = statusParam || ''

  const [classes, payments, summary] = await Promise.all([
    prisma.class.findMany({ orderBy: { name: 'asc' } }),
    prisma.payment.findMany({
      where: {
        ...(classId ? { student: { classId } } : {}),
        ...(term ? { term } : {}),
        ...(status === 'paid' ? { balance: 0 } : status === 'owing' ? { balance: { gt: 0 } } : {}),
      },
      include: { student: { include: { class: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.payment.aggregate({
      _sum: { amount: true, paid: true, balance: true },
      where: classId ? { student: { classId } } : {},
    }),
  ])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing & Fees</h1>
          <p className="text-sm text-slate-500">Track fee payments and outstanding balances</p>
        </div>
        <Link href="/billing/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Record Payment
        </Link>
      </div>

      <div className="p-6 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Billed</p>
            <p className="text-2xl font-display font-bold text-slate-900 mt-1">
              GHS {(summary._sum.amount || 0).toLocaleString()}
            </p>
          </div>
          <div className="card p-5 border-l-4 border-green-400">
            <p className="text-xs font-semibold text-green-600 uppercase">Collected</p>
            <p className="text-2xl font-display font-bold text-slate-900 mt-1">
              GHS {(summary._sum.paid || 0).toLocaleString()}
            </p>
          </div>
          <div className="card p-5 border-l-4 border-red-400">
            <p className="text-xs font-semibold text-red-500 uppercase">Outstanding</p>
            <p className="text-2xl font-display font-bold text-slate-900 mt-1">
              GHS {(summary._sum.balance || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <form className="flex gap-4 flex-wrap">
            <select name="classId" defaultValue={classIdParam || ''} className="input w-44">
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select name="term" defaultValue={term} className="input w-36">
              <option value="">All Terms</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
            <select name="status" defaultValue={status} className="input w-36">
              <option value="">All Status</option>
              <option value="paid">Fully Paid</option>
              <option value="owing">Has Balance</option>
            </select>
            <button type="submit" className="btn-primary">Filter</button>
            <Link href="/billing" className="btn-secondary">Clear</Link>
          </form>
        </div>

        {/* Table */}
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Fee Type</th>
                  <th>Term</th>
                  <th>Amount (GHS)</th>
                  <th>Paid (GHS)</th>
                  <th>Balance (GHS)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="font-medium text-slate-800">{p.student.name}</td>
                    <td><span className="badge badge-blue">{p.student.class.name}</span></td>
                    <td className="text-slate-500">{p.feeType}</td>
                    <td className="text-slate-500">{p.term}</td>
                    <td className="font-medium">{p.amount.toFixed(2)}</td>
                    <td className="text-green-600 font-medium">{p.paid.toFixed(2)}</td>
                    <td className={p.balance > 0 ? 'text-red-500 font-medium' : 'text-green-600'}>
                      {p.balance.toFixed(2)}
                    </td>
                    <td>
                      {p.balance === 0 ? (
                        <span className="badge badge-green flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <span className="badge badge-red flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Owing
                        </span>
                      )}
                    </td>
                    <td>
                      <Link href={`/billing/${p.id}/invoice`} className="text-xs text-brand-600 hover:underline font-medium">
                        Invoice
                      </Link>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">
                      <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      No payment records found.
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