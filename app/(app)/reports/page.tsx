// src/app/reports/page.tsx
import { prisma } from '@/lib/prisma'
import ReportActions from './ReportActions'
import { FileText, Users, Receipt } from 'lucide-react'

export default async function ReportsPage() {
  const [classes, settings] = await Promise.all([
    prisma.class.findMany({
      include: { _count: { select: { students: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.schoolSettings.findFirst(),
  ])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Documents</h1>
          <p className="text-sm text-slate-500">Generate report cards, class lists, and fee invoices</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Report Cards */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Terminal Report Cards</h2>
              <p className="text-xs text-slate-500">Generate individual PDF report cards for students</p>
            </div>
          </div>
          <ReportActions type="report-card" classes={classes} schoolName={settings?.schoolName || 'Our School'} />
        </div>

        {/* Class Lists */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Class Lists</h2>
              <p className="text-xs text-slate-500">Print full class registers for any grade</p>
            </div>
          </div>
          <ReportActions type="class-list" classes={classes} schoolName={settings?.schoolName || 'Our School'} />
        </div>

        {/* Fee Invoices */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Fee Invoices</h2>
              <p className="text-xs text-slate-500">Generate billing invoices per class or individual student</p>
            </div>
          </div>
          <ReportActions type="fee-invoice" classes={classes} schoolName={settings?.schoolName || 'Our School'} />
        </div>
      </div>
    </div>
  )
}
