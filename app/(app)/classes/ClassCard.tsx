'use client'
import Link from 'next/link'
import { BookOpen, Users, BarChart2 } from 'lucide-react'
import { Class } from '@/lib/api'

interface LevelColor { accent: string; bg: string; border: string; dot: string }

interface ClassCardProps {
  cls: Class
  lc: LevelColor
}

export default function ClassCard({ cls, lc }: ClassCardProps) {
  const studentCount = cls.student_count ?? 0
  const fillPct = Math.min(100, Math.round((studentCount / 40) * 100))

  return (
    <div
      className="class-card"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}
    >
      <div style={{ height: 3, background: lc.accent }} />
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: lc.bg, border: `1px solid ${lc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={20} color={lc.accent} />
          </div>
          <span style={{ background: lc.bg, color: lc.accent, border: `1px solid ${lc.border}`, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'system-ui' }}>
            {cls.level}
          </span>
        </div>
        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>{cls.name}</h3>
        <p style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 14 }}>
          {cls.section ? `Section ${cls.section}` : 'No section'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: lc.accent }}>{studentCount}</div>
            <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>students</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontFamily: 'system-ui', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Capacity</span>
            <span style={{ fontFamily: 'system-ui', fontSize: 10, color: lc.accent, fontWeight: 700 }}>{fillPct}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--border-soft)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${fillPct}%`, height: '100%', background: lc.accent, borderRadius: 2 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Link href={`/students?class=${cls.id}`} className="class-card-btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9, fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>
            <Users size={12} /> Students
          </Link>
          <Link href={`/results?classId=${cls.id}`} className="class-card-btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9, fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>
            <BarChart2 size={12} /> Results
          </Link>
        </div>
      </div>
      <style>{`.class-card { transition: box-shadow 0.2s ease, transform 0.2s ease; } .class-card:hover { box-shadow: 0 6px 24px rgba(15,31,61,0.10); transform: translateY(-2px); } .class-card-btn { transition: border-color 0.14s, background 0.14s; } .class-card-btn:hover { border-color: var(--gold) !important; background: var(--gold-pale) !important; }`}</style>
    </div>
  )
}
