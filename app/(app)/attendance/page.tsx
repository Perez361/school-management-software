'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarCheck, Save, CheckCircle2, XCircle, Clock, MinusCircle } from 'lucide-react'
import { api, Class, Student } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useLiveData } from '@/lib/live-data'

type Status = 'present' | 'absent' | 'late' | 'excused'

const STATUS_OPTIONS: { value: Status; label: string; color: string; bg: string; icon: React.ReactNode }[] = [
  { value: 'present', label: 'Present', color: '#15803d', bg: 'rgba(22,163,74,0.1)', icon: <CheckCircle2 size={14} /> },
  { value: 'absent',  label: 'Absent',  color: '#b91c1c', bg: 'rgba(185,28,28,0.1)', icon: <XCircle size={14} /> },
  { value: 'late',    label: 'Late',    color: '#b45309', bg: 'rgba(180,83,9,0.1)',  icon: <Clock size={14} /> },
  { value: 'excused', label: 'Excused', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: <MinusCircle size={14} /> },
]

const inp: React.CSSProperties = { padding: '9px 13px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }

export default function AttendancePage() {
  const { can, user } = useAuth()
  const { bump } = useLiveData()
  const router = useRouter()
  useEffect(() => { if (!can('attendance')) router.replace('/dashboard') }, [can, router])

  const [classes, setClasses]     = useState<Class[]>([])
  const [classId, setClassId]     = useState('')
  const [date, setDate]           = useState(new Date().toISOString().split('T')[0])
  const [term, setTerm]           = useState('')
  const [year, setYear]           = useState('')
  const [students, setStudents]   = useState<Student[]>([])
  const [statuses, setStatuses]   = useState<Record<number, Status>>({})
  const [loading, setLoading]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState('')

  // Load settings for default term/year
  useEffect(() => {
    Promise.all([api.getClasses(), api.getSettings()]).then(([cls, settings]) => {
      setClasses(cls)
      if (settings) { setTerm(settings.currentTerm); setYear(settings.currentYear) }
    })
  }, [])

  // Load students + existing attendance when class/date changes
  useEffect(() => {
    if (!classId || !date) return
    setLoading(true)
    Promise.all([
      api.getStudents({ classId: parseInt(classId) }),
      api.getAttendance({ classId: parseInt(classId), date }),
    ]).then(([studs, existing]) => {
      setStudents(studs)
      const map: Record<number, Status> = {}
      studs.forEach(s => { map[s.id] = 'present' })
      existing.forEach(e => { map[e.studentId] = e.status as Status })
      setStatuses(map)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [classId, date])

  async function handleSave() {
    if (!classId || !date || !term || !year) { setError('Please fill in all fields.'); return }
    setSaving(true); setError(''); setSaved(false)
    try {
      await api.recordAttendance({
        classId: parseInt(classId),
        date,
        term,
        year,
        records: Object.entries(statuses).map(([studentId, status]) => ({ studentId: parseInt(studentId), status })),
      })
      setSaved(true)
      bump()
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setSaving(false)
    }
  }

  const summary = Object.values(statuses).reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc }, {} as Record<string, number>)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Header */}
      <div style={{ padding: 'clamp(16px,4vw,28px) clamp(16px,4vw,32px) clamp(14px,3vw,24px)', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
            <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Academics</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Attendance</h1>
          <p style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Record daily class attendance</p>
        </div>
        {students.length > 0 && (
          <button onClick={handleSave} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: saved ? '#15803d' : 'var(--navy)', color: 'var(--gold-pale)', border: 'none', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
            {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Attendance'}
          </button>
        )}
      </div>

      <div style={{ padding: 'clamp(12px,3vw,24px) clamp(16px,4vw,32px)', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Filters */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 'clamp(14px,2vw,20px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Class</label>
              <select value={classId} onChange={e => setClassId(e.target.value)} style={{ ...inp, width: '100%', cursor: 'pointer' }}>
                <option value="">Select class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inp, width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Term</label>
              <select value={term} onChange={e => setTerm(e.target.value)} style={{ ...inp, width: '100%', cursor: 'pointer' }}>
                <option value="">Select term</option>
                {['Term 1','Term 2','Term 3'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Year</label>
              <input value={year} onChange={e => setYear(e.target.value)} placeholder="e.g. 2024/2025" style={{ ...inp, width: '100%' }} />
            </div>
          </div>
        </div>

        {error && <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontFamily: 'system-ui', fontSize: 13, color: '#b91c1c' }}>{error}</div>}

        {/* Summary badges */}
        {students.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {STATUS_OPTIONS.map(s => (
              <span key={s.value} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: s.bg, color: s.color, fontFamily: 'system-ui', fontSize: 12, fontWeight: 600 }}>
                {s.icon} {summary[s.value] || 0} {s.label}
              </span>
            ))}
          </div>
        )}

        {/* Student list */}
        {classId && !loading && students.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-muted)' }}>No students in this class.</div>
        )}

        {loading && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="skeleton skeleton-text" style={{ width: 160 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1,2,3,4].map(j => <div key={j} className="skeleton" style={{ width: 80, height: 32, borderRadius: 8 }} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && students.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            {/* Quick-set all buttons */}
            <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-soft)', background: 'var(--gold-pale)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Mark all:</span>
              {STATUS_OPTIONS.map(s => (
                <button key={s.value} onClick={() => setStatuses(prev => { const next = { ...prev }; students.forEach(st => { next[st.id] = s.value }); return next })} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 7, border: `1px solid ${s.color}`, background: 'transparent', color: s.color, fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            {students.map((s, i) => {
              const current = statuses[s.id] ?? 'present'
              const opt = STATUS_OPTIONS.find(o => o.value === current)!
              return (
                <div key={s.id} style={{ padding: '12px 20px', borderBottom: i < students.length - 1 ? '1px solid var(--border-soft)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: opt.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', fontSize: 10, fontWeight: 700, color: opt.color, flexShrink: 0 }}>
                      {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{s.name}</div>
                      <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>{s.studentId}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {STATUS_OPTIONS.map(o => (
                      <button key={o.value} onClick={() => setStatuses(prev => ({ ...prev, [s.id]: o.value }))}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, border: `1.5px solid ${current === o.value ? o.color : 'var(--border)'}`, background: current === o.value ? o.bg : 'transparent', color: current === o.value ? o.color : 'var(--text-muted)', fontFamily: 'system-ui', fontSize: 12, fontWeight: current === o.value ? 700 : 400, cursor: 'pointer', transition: 'all 0.1s' }}>
                        {o.icon} {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
