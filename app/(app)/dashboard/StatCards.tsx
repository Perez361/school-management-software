'use client'
// app/(app)/dashboard/StatCards.tsx
import Link from 'next/link'
import { Users, UserCheck, UserSquare2, BookOpen, ArrowUpRight } from 'lucide-react'

// Icon map lives in the client component — no functions cross the server/client boundary
const ICONS: Record<string, React.ElementType> = {
  Users,
  UserCheck,
  UserSquare2,
  BookOpen,
}

export interface StatItem {
  label: string
  value: number
  iconName: string   // plain string — safe to pass from server
  accent: string
  href: string
  note: string
}

export default function StatCards({ stats }: { stats: StatItem[] }) {
  return (
    <>
      <style>{`
        .stat-card-link { text-decoration: none; display: block; }
        .stat-card-link .stat-card { transition: box-shadow 0.2s ease, transform 0.2s ease; }
        .stat-card-link:hover .stat-card {
          box-shadow: 0 8px 32px rgba(15,31,61,0.08);
          transform: translateY(-1px);
        }
      `}</style>
      {stats.map(({ label, value, iconName, accent, href, note }) => {
        const Icon = ICONS[iconName] ?? Users
        return (
          <Link key={label} href={href} className="stat-card-link">
            <div className="stat-card" style={{ '--accent-color': accent } as React.CSSProperties}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
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
        )
      })}
    </>
  )
}