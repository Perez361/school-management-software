'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, BookOpen } from 'lucide-react'
import { api, Class } from '@/lib/api'
import ClassCard from './ClassCard'

interface LevelColor { accent: string; bg: string; border: string; dot: string }

const levelColors: Record<string, LevelColor> = {
  JHS1:   { accent: '#8B1A1A', bg: 'rgba(139,26,26,0.07)',  border: 'rgba(139,26,26,0.15)',  dot: '#C9A84C' },
  JHS2:   { accent: '#A52020', bg: 'rgba(165,32,32,0.07)',  border: 'rgba(165,32,32,0.15)',  dot: '#C9A84C' },
  JHS3:   { accent: '#7A1515', bg: 'rgba(122,21,21,0.07)',  border: 'rgba(122,21,21,0.15)',  dot: '#C9A84C' },
  SHS1:   { accent: '#b45309', bg: 'rgba(180,83,9,0.07)',   border: 'rgba(180,83,9,0.15)',   dot: '#d97706' },
  SHS2:   { accent: '#15803d', bg: 'rgba(22,163,74,0.07)',  border: 'rgba(22,163,74,0.15)',  dot: '#16a34a' },
  SHS3:   { accent: '#b91c1c', bg: 'rgba(185,28,28,0.07)',  border: 'rgba(185,28,28,0.15)',  dot: '#dc2626' },
  Basic1: { accent: '#C9A84C', bg: 'rgba(201,168,76,0.07)', border: 'rgba(201,168,76,0.15)', dot: '#C9A84C' },
  Basic2: { accent: '#C9A84C', bg: 'rgba(201,168,76,0.07)', border: 'rgba(201,168,76,0.15)', dot: '#C9A84C' },
  Basic3: { accent: '#C9A84C', bg: 'rgba(201,168,76,0.07)', border: 'rgba(201,168,76,0.15)', dot: '#C9A84C' },
  Basic4: { accent: '#8B1A1A', bg: 'rgba(139,26,26,0.07)',  border: 'rgba(139,26,26,0.15)',  dot: '#C9A84C' },
  Basic5: { accent: '#8B1A1A', bg: 'rgba(139,26,26,0.07)',  border: 'rgba(139,26,26,0.15)',  dot: '#C9A84C' },
  Basic6: { accent: '#8B1A1A', bg: 'rgba(139,26,26,0.07)',  border: 'rgba(139,26,26,0.15)',  dot: '#C9A84C' },
}
const fallbackLC: LevelColor = { accent: '#c9a84c', bg: 'rgba(201,168,76,0.07)', border: 'rgba(201,168,76,0.15)', dot: '#c9a84c' }
function getLevelColor(level: string): LevelColor {
  return levelColors[level.replace(/\s/g, '')] || fallbackLC
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getClasses().then(setClasses).finally(() => setLoading(false)) }, [])

  const totalStudents = classes.reduce((s, c) => s + (c.student_count ?? 0), 0)
  const levelGroups   = classes.reduce((acc, cls) => { if (!acc[cls.level]) acc[cls.level] = []; acc[cls.level].push(cls); return acc }, {} as Record<string, Class[]>)
  const hasMultipleLevels = Object.keys(levelGroups).length > 1

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      <div style={{ padding: 'clamp(16px,4vw,28px) clamp(16px,4vw,32px) clamp(14px,3vw,24px)', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
            <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Academics</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Classes</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)' }}>{classes.length} classes configured</span>
            <span style={{ fontFamily: 'system-ui', fontSize: 11, color: '#15803d', background: 'rgba(22,163,74,0.07)', padding: '2px 9px', borderRadius: 20, fontWeight: 600 }}>{totalStudents} students enrolled</span>
          </div>
        </div>
        <Link href="/classes/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'var(--navy)', color: 'var(--gold-pale)', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          <Plus size={15} /> Add Class
        </Link>
      </div>

      <div style={{ padding: 'clamp(12px,3vw,24px) clamp(16px,4vw,32px)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'system-ui', color: 'var(--text-muted)' }}>Loading…</div>
        ) : classes.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '80px 20px', textAlign: 'center' }}>
            <BookOpen size={26} color="var(--gold)" style={{ display: 'block', margin: '0 auto 16px' }} />
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>No classes created yet</div>
            <Link href="/classes/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--navy)', color: 'var(--gold-pale)', borderRadius: 9, textDecoration: 'none', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600 }}><Plus size={13} /> Create First Class</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,24px)' }}>
            {/* Summary strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 'clamp(8px,2vw,12px)' }}>
              {[
                { label: 'Total Classes',  value: classes.length,                                              color: 'var(--navy)' },
                { label: 'Total Students', value: totalStudents,                                               color: 'var(--navy)' },
                { label: 'Avg Class Size', value: classes.length ? Math.round(totalStudents / classes.length) : 0, color: '#15803d' },
                { label: 'Total Levels',   value: Object.keys(levelGroups).length,                             color: '#b45309' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 'clamp(12px,2vw,16px) clamp(12px,2vw,18px)' }}>
                  <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,3vw,26px)', fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Class cards — responsive grid */}
            {hasMultipleLevels
              ? Object.entries(levelGroups).map(([level, levelClasses]) => {
                  const lc = getLevelColor(level)
                  return (
                    <div key={level}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: lc.dot }} />
                        <span style={{ fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, color: lc.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{level}</span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
                        <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>{levelClasses.length} {levelClasses.length === 1 ? 'class' : 'classes'}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
                        {levelClasses.map(c => <ClassCard key={c.id} cls={c} lc={getLevelColor(c.level)} />)}
                      </div>
                    </div>
                  )
                })
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
                  {classes.map(c => <ClassCard key={c.id} cls={c} lc={getLevelColor(c.level)} />)}
                </div>
              )
            }
          </div>
        )}
      </div>
    </div>
  )
}