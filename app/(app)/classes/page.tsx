// app/(app)/classes/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, BookOpen } from 'lucide-react'
import ClassCard from './ClassCard'

export default async function ClassesPage() {
  const classes = await prisma.class.findMany({
    include: {
      _count: { select: { students: true } },
      staff: { where: { classId: { not: null } }, take: 1 },
      subjects: { include: { subject: true } },
    },
    orderBy: { name: 'asc' },
  })

  const totalStudents = classes.reduce((s, c) => s + c._count.students, 0)

  const levelColors: Record<string, { accent: string; bg: string; border: string; dot: string }> = {
    JHS1:   { accent: '#2563eb', bg: 'rgba(37,99,235,0.07)',   border: 'rgba(37,99,235,0.15)',   dot: '#2563eb' },
    JHS2:   { accent: '#7c3aed', bg: 'rgba(124,58,237,0.07)',  border: 'rgba(124,58,237,0.15)',  dot: '#7c3aed' },
    JHS3:   { accent: '#0369a1', bg: 'rgba(3,105,161,0.07)',   border: 'rgba(3,105,161,0.15)',   dot: '#0369a1' },
    SHS1:   { accent: '#b45309', bg: 'rgba(180,83,9,0.07)',    border: 'rgba(180,83,9,0.15)',    dot: '#d97706' },
    SHS2:   { accent: '#15803d', bg: 'rgba(22,163,74,0.07)',   border: 'rgba(22,163,74,0.15)',   dot: '#16a34a' },
    SHS3:   { accent: '#b91c1c', bg: 'rgba(185,28,28,0.07)',   border: 'rgba(185,28,28,0.15)',   dot: '#dc2626' },
    Basic1: { accent: '#0891b2', bg: 'rgba(8,145,178,0.07)',   border: 'rgba(8,145,178,0.15)',   dot: '#0891b2' },
    Basic2: { accent: '#0891b2', bg: 'rgba(8,145,178,0.07)',   border: 'rgba(8,145,178,0.15)',   dot: '#0891b2' },
    Basic3: { accent: '#0891b2', bg: 'rgba(8,145,178,0.07)',   border: 'rgba(8,145,178,0.15)',   dot: '#0891b2' },
    Basic4: { accent: '#7c3aed', bg: 'rgba(124,58,237,0.07)',  border: 'rgba(124,58,237,0.15)',  dot: '#7c3aed' },
    Basic5: { accent: '#7c3aed', bg: 'rgba(124,58,237,0.07)',  border: 'rgba(124,58,237,0.15)',  dot: '#7c3aed' },
    Basic6: { accent: '#7c3aed', bg: 'rgba(124,58,237,0.07)',  border: 'rgba(124,58,237,0.15)',  dot: '#7c3aed' },
  }

  function getLevelColor(level: string) {
    const key = level.replace(/\s/g, '')
    return levelColors[key] || { accent: '#c9a84c', bg: 'rgba(201,168,76,0.07)', border: 'rgba(201,168,76,0.15)', dot: '#c9a84c' }
  }

  const levelGroups = classes.reduce((acc, cls) => {
    const level = cls.level
    if (!acc[level]) acc[level] = []
    acc[level].push(cls)
    return acc
  }, {} as Record<string, typeof classes>)

  const hasMultipleLevels = Object.keys(levelGroups).length > 1

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* ── Header ── */}
      <div style={{
        padding: '28px 32px 24px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
            <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Academics</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>
            Classes
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
            <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)' }}>
              {classes.length} classes configured
            </span>
            <span style={{ fontFamily: 'system-ui', fontSize: 11, color: '#15803d', background: 'rgba(22,163,74,0.07)', padding: '2px 9px', borderRadius: 20, fontWeight: 600 }}>
              {totalStudents} students enrolled
            </span>
          </div>
        </div>
        <Link href="/classes/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '10px 20px', background: 'var(--navy)', color: '#faf7f0',
          borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600,
          textDecoration: 'none', boxShadow: '0 2px 10px rgba(15,31,61,0.2)',
        }}>
          <Plus size={15} /> Add Class
        </Link>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {classes.length === 0 ? (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
            padding: '80px 20px', textAlign: 'center',
          }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(201,168,76,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <BookOpen size={26} color="var(--gold)" />
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
              No classes created yet
            </div>
            <div style={{ fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Create your first class to start enrolling students
            </div>
            <Link href="/classes/new" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', background: 'var(--navy)', color: '#faf7f0',
              borderRadius: 9, textDecoration: 'none', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600,
            }}>
              <Plus size={13} /> Create First Class
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Summary strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Total Classes',      value: classes.length,                                                    color: 'var(--navy)' },
                { label: 'Total Students',     value: totalStudents,                                                     color: '#2563eb'     },
                { label: 'Avg Class Size',     value: classes.length ? Math.round(totalStudents / classes.length) : 0,  color: '#15803d'     },
                { label: 'With Class Teacher', value: classes.filter(c => c.staff.length > 0).length,                   color: '#b45309'     },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    {label}
                  </div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Cards */}
            {hasMultipleLevels
              ? Object.entries(levelGroups).map(([level, levelClasses]) => {
                  const lc = getLevelColor(level)
                  return (
                    <div key={level}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: lc.dot }} />
                        <span style={{ fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, color: lc.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {level}
                        </span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
                        <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>
                          {levelClasses.length} {levelClasses.length === 1 ? 'class' : 'classes'}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                        {levelClasses.map(c => (
                          <ClassCard key={c.id} cls={c} lc={getLevelColor(c.level)} />
                        ))}
                      </div>
                    </div>
                  )
                })
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  {classes.map(c => (
                    <ClassCard key={c.id} cls={c} lc={getLevelColor(c.level)} />
                  ))}
                </div>
              )
            }
          </div>
        )}
      </div>
    </div>
  )
}