'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Users, Plus, Minus } from 'lucide-react'
import { api, Class } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useLiveData } from '@/lib/live-data'
import { GHANA_CLASSES, LEVEL_GROUPS } from '@/lib/school-data'

export default function ClassesPage() {
  const { can } = useAuth()
  const { version, bump } = useLiveData()
  const router = useRouter()
  useEffect(() => { if (!can('classes')) router.replace('/dashboard') }, [can, router])

  const [classes, setClasses]   = useState<Class[]>([])
  const [loading, setLoading]   = useState(true)
  const [working, setWorking]   = useState<string | null>(null) // class name being toggled

  useEffect(() => {
    api.getClasses().then(setClasses).finally(() => setLoading(false))
  }, [version])

  const activeNames = new Set(classes.map(c => c.name))
  const totalStudents = classes.reduce((s, c) => s + (c.student_count ?? 0), 0)

  async function activate(name: string, level: string) {
    setWorking(name)
    try {
      await api.createClass({ name, level })
      bump()
    } catch (e: any) {
      alert(e.message || String(e))
    } finally { setWorking(null) }
  }

  async function deactivate(name: string) {
    const cls = classes.find(c => c.name === name)
    if (!cls) return
    if ((cls.student_count ?? 0) > 0) {
      alert(`Cannot remove ${name} — it has ${cls.student_count} enrolled student(s). Reassign them first.`)
      return
    }
    if (!confirm(`Remove ${name} from your school?`)) return
    setWorking(name)
    try {
      await api.deleteClass(cls.id)
      bump()
    } catch (e: any) {
      alert(e.message || String(e))
    } finally { setWorking(null) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* Header */}
      <div style={{ padding: 'clamp(16px,4vw,28px) clamp(16px,4vw,32px) clamp(14px,3vw,24px)', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
          <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Academics</span>
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Classes</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)' }}>{classes.length} active classes</span>
          <span style={{ fontFamily: 'system-ui', fontSize: 11, color: '#15803d', background: 'rgba(22,163,74,0.07)', padding: '2px 9px', borderRadius: 20, fontWeight: 600 }}>{totalStudents} students enrolled</span>
          <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>Click a class to activate or deactivate it</span>
        </div>
      </div>

      <div style={{ padding: 'clamp(12px,3vw,24px) clamp(16px,4vw,32px)', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12 }}>
          {[
            { label: 'Active Classes',  value: classes.length,  color: 'var(--navy)' },
            { label: 'Total Students',  value: totalStudents,   color: 'var(--navy)' },
            { label: 'Avg Class Size',  value: classes.length ? Math.round(totalStudents / classes.length) : 0, color: '#15803d' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(22px,3vw,28px)', fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Class groups */}
        {LEVEL_GROUPS.map(group => {
          const groupClasses = GHANA_CLASSES.filter(c => c.level === group.level)
          return (
            <div key={group.level}>
              {/* Group header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: group.color }} />
                <span style={{ fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, color: group.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{group.label}</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
                <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>
                  {groupClasses.filter(c => activeNames.has(c.name)).length} / {groupClasses.length} active
                </span>
              </div>

              {/* Class cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
                {groupClasses.map(gc => {
                  const active = activeNames.has(gc.name)
                  const cls = classes.find(c => c.name === gc.name)
                  const busy = working === gc.name
                  const studentCount = cls?.student_count ?? 0

                  return (
                    <div key={gc.name} style={{
                      background: active ? 'var(--surface)' : 'var(--cream)',
                      border: `1.5px solid ${active ? group.border : 'var(--border-soft)'}`,
                      borderRadius: 12,
                      padding: '16px 18px',
                      opacity: busy ? 0.6 : 1,
                      transition: 'all 0.15s',
                    }}>
                      {/* Class name + badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: active ? group.color : 'var(--text-muted)' }}>
                          {gc.name}
                        </span>
                        {active
                          ? <span style={{ fontSize: 10, fontWeight: 700, color: group.color, background: group.bg, padding: '2px 8px', borderRadius: 20, fontFamily: 'system-ui' }}>Active</span>
                          : <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--border-soft)', padding: '2px 8px', borderRadius: 20, fontFamily: 'system-ui' }}>Inactive</span>
                        }
                      </div>

                      {/* Student count (active only) */}
                      {active && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                          <Users size={11} color="var(--text-muted)" />
                          <span style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)' }}>
                            {studentCount} student{studentCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}

                      {/* Action button */}
                      {active ? (
                        <button
                          onClick={() => deactivate(gc.name)}
                          disabled={busy}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'system-ui', fontSize: 12, color: '#dc2626', fontWeight: 600 }}
                        >
                          <Minus size={12} /> Remove
                        </button>
                      ) : (
                        <button
                          onClick={() => activate(gc.name, group.label)}
                          disabled={busy || loading}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', background: group.bg, border: `1px solid ${group.border}`, borderRadius: 7, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'system-ui', fontSize: 12, color: group.color, fontWeight: 600 }}
                        >
                          <Plus size={12} /> Add to school
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
