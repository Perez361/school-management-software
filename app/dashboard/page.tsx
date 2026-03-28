// src/app/dashboard/page.tsx
import { prisma } from '@/lib/prisma'
import { Users, UserCheck, UserSquare2, Receipt, TrendingUp, Award } from 'lucide-react'
import DashboardCharts from './DashboardCharts'

export default async function DashboardPage() {
  const [
    totalStudents, totalParents, totalStaff, totalClasses,
    totalRevenue, pendingBalance, recentPayments, topStudents
  ] = await Promise.all([
    prisma.student.count(),
    prisma.parent.count(),
    prisma.staff.count(),
    prisma.class.count(),
    prisma.payment.aggregate({ _sum: { paid: true } }),
    prisma.payment.aggregate({ _sum: { balance: true } }),
    prisma.payment.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      include: { student: { include: { class: true } } },
    }),
    prisma.result.groupBy({
      by: ['studentId'],
      _avg: { total: true },
      orderBy: { _avg: { total: 'desc' } },
      take: 5,
    }),
  ])

  // Get student names for top students
  const topStudentIds = topStudents.map(t => t.studentId)
  const topStudentDetails = await prisma.student.findMany({
    where: { id: { in: topStudentIds } },
    include: { class: true },
  })

  const topWithNames = topStudents.map(t => ({
    ...t,
    student: topStudentDetails.find(s => s.id === t.studentId),
  }))

  const stats = [
    { label: 'Total Students', value: totalStudents, icon: Users, color: 'brand', change: '+12 this term' },
    { label: 'Parents', value: totalParents, icon: UserCheck, color: 'green', change: 'registered' },
    { label: 'Staff Members', value: totalStaff, icon: UserSquare2, color: 'amber', change: 'active' },
    { label: 'Classes', value: totalClasses, icon: Receipt, color: 'purple', change: 'running' },
  ]

  const colorMap: Record<string, string> = {
    brand:  'bg-brand-50 text-brand-600',
    green:  'bg-green-50 text-green-600',
    amber:  'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back, Administrator</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-brand-50 text-brand-700 px-3 py-1.5 rounded-full font-medium">
          <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></span>
          Term 1 — 2024
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color, change }) => (
            <div key={label} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">{label}</p>
                  <p className="text-3xl font-display font-bold text-slate-900 mt-1">{value}</p>
                  <p className="text-xs text-slate-400 mt-1">{change}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5 border-l-4 border-green-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Fees Collected</p>
                <p className="text-2xl font-display font-bold text-slate-900">
                  GHS {(totalRevenue._sum.paid || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-5 border-l-4 border-amber-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Receipt className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Outstanding Balance</p>
                <p className="text-2xl font-display font-bold text-slate-900">
                  GHS {(pendingBalance._sum.balance || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Top Students */}
          <div className="card p-5 col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-slate-800 text-sm">Top Students</h3>
            </div>
            <div className="space-y-3">
              {topWithNames.map((t, i) => (
                <div key={t.studentId} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                    ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{t.student?.name}</p>
                    <p className="text-xs text-slate-400">{t.student?.class?.name}</p>
                  </div>
                  <span className="text-xs font-semibold text-brand-600 shrink-0">
                    {t._avg.total?.toFixed(1)}%
                  </span>
                </div>
              ))}
              {topWithNames.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No results entered yet</p>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="card p-5 col-span-2">
            <h3 className="font-semibold text-slate-800 text-sm mb-4">Recent Payments</h3>
            <div className="space-y-2">
              {recentPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.student.name}</p>
                    <p className="text-xs text-slate-400">{p.student.class.name} · {p.feeType} · {p.term}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">GHS {p.paid.toFixed(2)}</p>
                    {p.balance > 0 && (
                      <p className="text-xs text-red-500">Bal: GHS {p.balance.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
              {recentPayments.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-8">No payments recorded yet</p>
              )}
            </div>
          </div>
        </div>

        <DashboardCharts />
      </div>
    </div>
  )
}
