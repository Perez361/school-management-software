'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Receipt, Award, ArrowUpRight } from 'lucide-react'
import { api, DashboardStats, TopStudent, Payment, SchoolSettings } from '@/lib/api'
import DashboardCharts from './DashboardCharts'
import QuickActions from './QuickActions'

const STAT_CONFIG = [
  { label: 'Total Students', key: 'totalStudents' as const, accent: '#C9A84C', href: '/students', note: 'enrolled' },
  { label: 'Total Staff',    key: 'totalStaff'    as const, accent: '#8B1A1A', href: '/staff',    note: 'active'    },
  { label: 'Classes',        key: 'totalClasses'  as const, accent: '#C9A84C', href: '/classes',  note: 'running'   },
  { label: 'Parents',        key: 'totalParents'  as const, accent: '#16a34a', href: '/parents',  note: 'registered' },
]

export default function DashboardPage() {
  const [stats, setStats]               = useState<DashboardStats | null>(null)
  const [topStudents, setTopStudents]   = useState<TopStudent[]>([])
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [settings, setSettings]         = useState<SchoolSettings | null>(null)

  useEffect(() => {
    Promise.all([
      api.getDashboardStats(),
      api.getTopStudents(),
      api.getPayments(),
      api.getSettings(),
    ]).then(([s, top, pays, cfg]) => {
      setStats(s)
      setTopStudents(top)
      setRecentPayments(pays.slice(0, 6))
      setSettings(cfg)
    })
  }, [])

  const collected      = stats?.totalCollected ?? 0
  const outstanding    = stats?.totalOutstanding ?? 0
  const total          = collected + outstanding
  const collectionRate = total > 0 ? Math.round((collected / total) * 100) : 0
  const termLabel      = settings ? `${settings.currentTerm} — ${settings.currentYear}` : 'Term 1 — 2024'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* ── Header ── */}
      <div style={{
        padding: 'clamp(16px,4vw,32px) clamp(16px,4vw,32px) 0',
        background: 'linear-gradient(180deg,#fff 0%,var(--cream) 100%)',
        borderBottom: '1px solid var(--border-soft)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 20, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
              <span style={{ fontFamily: 'system-ui', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Overview</span>
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>School Dashboard</h1>
            <p style={{ fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Welcome back, Administrator</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--navy)', borderRadius: 10, padding: '8px 14px', border: '1px solid rgba(201,168,76,0.2)', flexShrink: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
            <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--gold-light)', fontWeight: 600 }}>{termLabel}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: 'clamp(12px,3vw,28px) clamp(16px,4vw,32px)', display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,20px)' }}>

        {/* ── Stat cards — responsive grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 'clamp(8px,2vw,16px)' }}>
          {STAT_CONFIG.map(({ label, key, accent, href, note }) => (
            <Link key={label} href={href} style={{ textDecoration: 'none', display: 'block' }}>
              <div className="stat-card" style={{ '--accent-color': accent } as React.CSSProperties}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${accent}15`, border: `1px solid ${accent}30` }}>
                    <span style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: accent, fontWeight: 700 }}>#</span>
                  </div>
                  <ArrowUpRight size={14} color="var(--text-muted)" />
                </div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(22px,4vw,34px)', fontWeight: 700, color: 'var(--navy)', lineHeight: 1, marginBottom: 4 }}>
                  {stats ? stats[key].toLocaleString() : '—'}
                </div>
                <div style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
                <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{note}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Finance strip — stacks on mobile ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 'clamp(8px,2vw,16px)' }}>

          {/* Fees Collected */}
          <div className="card-gold" style={{ padding: 'clamp(16px,3vw,24px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={16} color="var(--gold)" />
              </div>
              <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--on-crimson-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Fees Collected</span>
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 700, color: 'var(--gold-light)', letterSpacing: '-0.02em' }}>
              GHS {collected.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <div style={{ flex: 1, height: 4, background: 'rgba(201,168,76,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${collectionRate}%`, height: '100%', background: 'var(--gold)', borderRadius: 2 }} />
              </div>
              <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>{collectionRate}%</span>
            </div>
          </div>

          {/* Outstanding */}
          <div className="card" style={{ padding: 'clamp(16px,3vw,24px)', borderLeft: '3px solid #fbbf24' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Receipt size={16} color="#d97706" />
              </div>
              <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Outstanding</span>
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 700, color: 'var(--navy)' }}>
              GHS {outstanding.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </div>
            <Link href="/billing?status=owing" style={{ fontFamily: 'system-ui', fontSize: 11, color: '#d97706', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10 }}>
              View unpaid <ArrowUpRight size={11} />
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ padding: 'clamp(16px,3vw,24px)' }}>
            <div style={{ fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Quick Actions</div>
            <QuickActions />
          </div>
        </div>

        {/* ── Top students + recent payments — stack on mobile ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'clamp(8px,2vw,16px)' }}>

          {/* Top Students */}
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={15} color="#d97706" />
              </div>
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Top Students</div>
                <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>By average score</div>
              </div>
            </div>
            <div style={{ padding: '8px 0' }}>
              {topStudents.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-muted)' }}>No results entered yet</div>
              ) : topStudents.map((t, i) => {
                const medals = ['🥇', '🥈', '🥉']
                return (
                  <div key={t.studentId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: i < topStudents.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i < 3 ? 14 : 12, flexShrink: 0 }}>
                      {i < 3 ? medals[i] : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                      <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>{t.class}</div>
                    </div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: i === 0 ? 'var(--gold)' : 'var(--navy)' }}>
                      {t.avg.toFixed(1)}<span style={{ fontSize: 10, fontFamily: 'system-ui', color: 'var(--text-muted)', fontWeight: 400 }}>%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={15} color="#16a34a" />
                </div>
                <div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Recent Payments</div>
                  <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>Latest fee transactions</div>
                </div>
              </div>
              <Link href="/billing" style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--gold)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                View all <ArrowUpRight size={11} />
              </Link>
            </div>
            <div>
              {recentPayments.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-muted)' }}>No payments recorded yet</div>
              ) : recentPayments.map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px', borderBottom: i < recentPayments.length - 1 ? '1px solid var(--border-soft)' : 'none', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--gold-pale)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, color: 'var(--navy)', flexShrink: 0 }}>
                      {p.student?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.student?.name}</div>
                      <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.student?.class?.name} · {p.feeType}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: '#16a34a' }}>GHS {p.paid.toFixed(2)}</div>
                    {p.balance > 0 && <div style={{ fontFamily: 'system-ui', fontSize: 11, color: '#dc2626', fontWeight: 500 }}>Bal: {p.balance.toFixed(2)}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts — hidden on very small screens, shown on tablet+ */}
        <div style={{ overflowX: 'auto' }}>
          <DashboardCharts />
        </div>
      </div>
    </div>
  )
}