// app/dashboard/page.tsx
import { prisma } from '@/lib/prisma'
import { Users, UserCheck, UserSquare2, BookOpen, TrendingUp, Receipt, Award, ArrowUpRight } from 'lucide-react'
import DashboardCharts from './DashboardCharts'
import Link from 'next/link'

export default async function DashboardPage() {
  const [
    totalStudents, totalParents, totalStaff, totalClasses,
    totalRevenue, pendingBalance, recentPayments, topStudents, settings
  ] = await Promise.all([
    prisma.student.count(),
    prisma.parent.count(),
    prisma.staff.count(),
    prisma.class.count(),
    prisma.payment.aggregate({ _sum: { paid: true } }),
    prisma.payment.aggregate({ _sum: { balance: true } }),
    prisma.payment.findMany({
      take: 6, orderBy: { createdAt: 'desc' },
      include: { student: { include: { class: true } } },
    }),
    prisma.result.groupBy({
      by: ['studentId'],
      _avg: { total: true },
      orderBy: { _avg: { total: 'desc' } },
      take: 5,
    }),
    prisma.schoolSettings.findFirst(),
  ])

  const topStudentIds = topStudents.map(t => t.studentId)
  const topStudentDetails = await prisma.student.findMany({
    where: { id: { in: topStudentIds } },
    include: { class: true },
  })
  const topWithNames = topStudents.map(t => ({
    ...t,
    student: topStudentDetails.find(s => s.id === t.studentId),
  }))

  const collected = totalRevenue._sum.paid || 0
  const outstanding = pendingBalance._sum.balance || 0
  const total = collected + outstanding
  const collectionRate = total > 0 ? Math.round((collected / total) * 100) : 0

  const stats = [
    { label: 'Total Students', value: totalStudents, icon: Users,        accent: '#c9a84c', href: '/students', note: 'enrolled' },
    { label: 'Parents',        value: totalParents,  icon: UserCheck,     accent: '#16a34a', href: '/parents',  note: 'registered' },
    { label: 'Staff Members',  value: totalStaff,    icon: UserSquare2,   accent: '#2563eb', href: '/staff',    note: 'active' },
    { label: 'Classes',        value: totalClasses,  icon: BookOpen,      accent: '#9333ea', href: '/classes',  note: 'running' },
  ]

  const termLabel = settings
    ? `${settings.currentTerm} — ${settings.currentYear}`
    : 'Term 1 — 2024'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* ── Page Header ── */}
      <div style={{
        padding: '32px 32px 0',
        background: 'linear-gradient(180deg, #fff 0%, var(--cream) 100%)',
        borderBottom: '1px solid var(--border-soft)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
              <span style={{ fontFamily: 'system-ui', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>
                Overview
              </span>
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              School Dashboard
            </h1>
            <p style={{ fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Welcome back, Administrator
            </p>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--navy)', borderRadius: 10, padding: '10px 16px',
            border: '1px solid rgba(201,168,76,0.2)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', animation: 'pulse 2s ease-out infinite' }} />
            <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--gold-light)', fontWeight: 600 }}>
              {termLabel}
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {stats.map(({ label, value, icon: Icon, accent, href, note }) => (
            <Link key={label} href={href} style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ '--accent-color': accent } as React.CSSProperties}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${accent}15`, border: `1px solid ${accent}30`,
                  }}>
                    <Icon size={19} color={accent} />
                  </div>
                  <ArrowUpRight size={14} color="var(--text-muted)" />
                </div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 700, color: 'var(--navy)', lineHeight: 1, marginBottom: 4 }}>
                  {value.toLocaleString()}
                </div>
                <div style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {label}
                </div>
                <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {note}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Revenue Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 16 }}>

          {/* Collected */}
          <div className="card-gold" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(201,168,76,0.08)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={16} color="var(--gold)" />
              </div>
              <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'rgba(201,168,76,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Fees Collected
              </span>
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: 'var(--gold-light)', letterSpacing: '-0.02em' }}>
              GHS {collected.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <div style={{ flex: 1, height: 4, background: 'rgba(201,168,76,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${collectionRate}%`, height: '100%', background: 'var(--gold)', borderRadius: 2, transition: 'width 1s ease' }} />
              </div>
              <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>{collectionRate}%</span>
            </div>
          </div>

          {/* Outstanding */}
          <div className="card" style={{ padding: 24, borderLeft: '3px solid #fbbf24', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: '#fffbeb' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Receipt size={16} color="#d97706" />
              </div>
              <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Outstanding
              </span>
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>
              GHS {outstanding.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </div>
            <Link href="/billing?status=owing" style={{ fontFamily: 'system-ui', fontSize: 11, color: '#d97706', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10 }}>
              View unpaid <ArrowUpRight size={11} />
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Quick Actions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Add New Student', href: '/students/new', color: 'var(--navy)' },
                { label: 'Record Payment',  href: '/billing/new',  color: '#16a34a' },
                { label: 'Enter Results',   href: '/results/enter',color: '#2563eb' },
                { label: 'Generate Reports',href: '/reports',      color: '#9333ea' },
              ].map(({ label, href, color }) => (
                <Link key={href} href={href} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)',
                  fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: color,
                  textDecoration: 'none', background: 'var(--surface-2)',
                  transition: 'border-color 0.15s, background 0.15s',
                }}>
                  {label}
                  <ArrowUpRight size={12} />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16 }}>

          {/* Top Students */}
          <div className="card">
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={15} color="#d97706" />
              </div>
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Top Students</div>
                <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>By average score</div>
              </div>
            </div>
            <div style={{ padding: '8px 0' }}>
              {topWithNames.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-muted)' }}>
                  No results entered yet
                </div>
              ) : topWithNames.map((t, i) => {
                const medals = ['🥇', '🥈', '🥉']
                return (
                  <div key={t.studentId} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 20px', borderBottom: i < topWithNames.length - 1 ? '1px solid var(--border-soft)' : 'none',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: i < 3 ? ['#fffbeb','#f8fafc','#fff7ed'][i] : 'var(--surface-2)',
                      border: `1px solid ${i < 3 ? ['#fcd34d','#cbd5e1','#fdba74'][i] : 'var(--border)'}`,
                      fontSize: i < 3 ? 14 : 12,
                      fontFamily: 'system-ui', fontWeight: 700,
                      color: i < 3 ? undefined : 'var(--text-muted)',
                      flexShrink: 0,
                    }}>
                      {i < 3 ? medals[i] : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.student?.name}
                      </div>
                      <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>
                        {t.student?.class?.name}
                      </div>
                    </div>
                    <div style={{
                      fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700,
                      color: i === 0 ? 'var(--gold)' : 'var(--navy)',
                    }}>
                      {t._avg.total?.toFixed(1)}
                      <span style={{ fontSize: 10, fontFamily: 'system-ui', color: 'var(--text-muted)', fontWeight: 400 }}>%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="card">
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={15} color="#16a34a" />
                </div>
                <div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Recent Payments</div>
                  <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>Latest fee transactions</div>
                </div>
              </div>
              <Link href="/billing" style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--gold)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                View all <ArrowUpRight size={11} />
              </Link>
            </div>
            <div>
              {recentPayments.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-muted)' }}>
                  No payments recorded yet
                </div>
              ) : recentPayments.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 20px',
                  borderBottom: i < recentPayments.length - 1 ? '1px solid var(--border-soft)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9,
                      background: 'var(--gold-pale)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, color: 'var(--navy)',
                      flexShrink: 0,
                    }}>
                      {p.student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>
                        {p.student.name}
                      </div>
                      <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>
                        {p.student.class.name} · {p.feeType} · {p.term}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: '#16a34a' }}>
                      GHS {p.paid.toFixed(2)}
                    </div>
                    {p.balance > 0 && (
                      <div style={{ fontFamily: 'system-ui', fontSize: 11, color: '#dc2626', fontWeight: 500 }}>
                        Bal: {p.balance.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Charts ── */}
        <DashboardCharts />

      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.5); opacity: 0.4; }
          100% { transform: scale(1); opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}