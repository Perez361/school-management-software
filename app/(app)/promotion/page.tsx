'use client'
import { useState, useEffect } from 'react'
import { GraduationCap, ArrowRight, RotateCcw, CheckCircle, AlertCircle, Users, ChevronDown } from 'lucide-react'
import { api, Student, Class, ResultRow } from '@/lib/api'
import { GHANA_CLASSES } from '@/lib/school-data'
import RoleGuard from '@/components/RoleGuard'

// Given a class name, return the next class name in the GES progression
// Returns null for JHS 3 (graduation)
function nextClassName(name: string): string | null {
  const idx = GHANA_CLASSES.findIndex(c => c.name === name)
  if (idx === -1 || idx === GHANA_CLASSES.length - 1) return null
  return GHANA_CLASSES[idx + 1].name
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'system-ui', fontSize: 11, fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: 5, letterSpacing: '0.04em',
}
const selectStyle: React.CSSProperties = {
  width: '100%', padding: '9px 13px', background: 'var(--surface-2)',
  border: '1.5px solid var(--border)', borderRadius: 8,
  fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none',
}

type Decision = 'promote' | 'repeat'

export default function PromotionPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [classId, setClassId] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [avgScores, setAvgScores] = useState<Record<number, number>>({})
  const [decisions, setDecisions] = useState<Record<number, Decision>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ promoted: number; repeated: number; graduated: number } | null>(null)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    api.getClasses().then(setClasses)
  }, [])

  useEffect(() => {
    if (!classId) { setStudents([]); setDecisions({}); setAvgScores({}); setResult(null); setConfirmed(false); return }
    setLoading(true)
    Promise.all([
      api.getStudents({ classId: parseInt(classId) }),
      api.getResults({ classId: parseInt(classId) }),
    ]).then(([data, results]) => {
      setStudents(data)
      const init: Record<number, Decision> = {}
      data.forEach(s => { init[s.id] = 'promote' })
      setDecisions(init)
      // Compute per-student average from the most recent term's results
      const byStudent: Record<number, ResultRow[]> = {}
      for (const r of results) {
        if (!byStudent[r.studentId]) byStudent[r.studentId] = []
        byStudent[r.studentId].push(r)
      }
      const avgs: Record<number, number> = {}
      for (const [sid, rows] of Object.entries(byStudent)) {
        // Use the most recent year+term set
        const termKeys = [...new Set(rows.map(r => `${r.year}|${r.term}`))].sort().reverse()
        const latestKey = termKeys[0]
        if (latestKey) {
          const [ly, lt] = latestKey.split('|')
          const latest = rows.filter(r => r.year === ly && r.term === lt)
          avgs[Number(sid)] = latest.reduce((s, r) => s + r.total, 0) / latest.length
        }
      }
      setAvgScores(avgs)
      setResult(null)
      setConfirmed(false)
    }).finally(() => setLoading(false))
  }, [classId])

  const selectedClass = classes.find(c => c.id === parseInt(classId))
  const nextClass = selectedClass ? nextClassName(selectedClass.name) : null
  const nextClassObj = nextClass ? classes.find(c => c.name === nextClass) : null
  const isJHS3 = selectedClass?.name === 'JHS 3'

  const repeatCount = Object.values(decisions).filter(d => d === 'repeat').length
  const promoteCount = students.length - repeatCount

  function toggleAll(d: Decision) {
    setDecisions(prev => {
      const next = { ...prev }
      students.forEach(s => { next[s.id] = d })
      return next
    })
  }

  async function applyPromotion() {
    if (!classId) return
    setError('')
    setSaving(true)
    try {
      const repeatIds = students.filter(s => decisions[s.id] === 'repeat').map(s => s.id)
      const res = await api.promoteClass({
        classId: parseInt(classId),
        nextClassId: isJHS3 ? null : (nextClassObj?.id ?? null),
        repeatStudentIds: repeatIds,
      })
      setResult(res)
      // Reload student list — promoted/graduated students will disappear
      const updated = await api.getStudents({ classId: parseInt(classId) })
      setStudents(updated)
      const init: Record<number, Decision> = {}
      updated.forEach(s => { init[s.id] = 'promote' })
      setDecisions(init)
      setConfirmed(false)
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setSaving(false)
    }
  }

  const actionLabel = isJHS3 ? 'Graduate' : `Promote to ${nextClass ?? '?'}`
  const actionColor = isJHS3 ? '#7c3aed' : '#15803d'
  const actionBg    = isJHS3 ? 'rgba(124,58,237,0.08)' : 'rgba(22,163,74,0.08)'

  return (
    <RoleGuard feature="settings">
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* Header */}
      <div style={{ padding: 'clamp(16px,4vw,28px) clamp(16px,4vw,32px) clamp(14px,3vw,24px)', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
          <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Administration</span>
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Year-End Promotion</h1>
        <p style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
          Promote students to their next class, mark repeaters, or graduate JHS 3. All historical records (CA, results, attendance) are preserved.
        </p>
      </div>

      <div style={{ padding: 'clamp(12px,3vw,24px) clamp(16px,4vw,32px)', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* How it works info box */}
        <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--navy)', fontWeight: 700, marginBottom: 6 }}>How records are handled</div>
          <ul style={{ margin: 0, padding: '0 0 0 16px', fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <li><strong>Promoted students</strong> — moved to the next class. Their CA scores, results, attendance, and payments under the current year/term remain fully accessible.</li>
            <li><strong>Repeated students</strong> — stay in the same class. Old records remain under the old year; new year starts fresh.</li>
            <li><strong>Graduated students (JHS 3)</strong> — marked as graduated and removed from the active roster. All records are preserved for alumni lookup.</li>
          </ul>
        </div>

        {/* Class selector */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 'clamp(14px,3vw,20px) clamp(16px,3vw,24px)' }}>
          <div style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Select Class to Process</div>
          <div style={{ maxWidth: 320 }}>
            <label style={labelStyle}>Class *</label>
            <select style={selectStyle} value={classId} onChange={e => setClassId(e.target.value)}>
              <option value="">Select class…</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.student_count ?? 0} active students)
                </option>
              ))}
            </select>
          </div>

          {selectedClass && (
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--navy)', color: 'var(--gold-pale)', borderRadius: 9, padding: '7px 14px', fontFamily: 'system-ui', fontSize: 13, fontWeight: 600 }}>
                {selectedClass.name}
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
              {isJHS3 ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 9, padding: '7px 14px', fontFamily: 'system-ui', fontSize: 13, fontWeight: 600 }}>
                  <GraduationCap size={14} /> Graduated
                </div>
              ) : nextClass ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(22,163,74,0.1)', color: '#15803d', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 9, padding: '7px 14px', fontFamily: 'system-ui', fontSize: 13, fontWeight: 600 }}>
                  {nextClass}
                </div>
              ) : (
                <span style={{ fontFamily: 'system-ui', fontSize: 12, color: '#b91c1c' }}>
                  Next class not found — ensure classes are set up correctly.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Student list */}
        {classId && (
          <>
            {loading ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '40px 20px', textAlign: 'center', fontFamily: 'system-ui', fontSize: 14, color: 'var(--text-muted)' }}>Loading students…</div>
            ) : students.length === 0 ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '40px 20px', textAlign: 'center' }}>
                <Users size={22} color="var(--text-muted)" style={{ display: 'block', margin: '0 auto 10px' }} />
                <div style={{ fontFamily: 'system-ui', fontSize: 14, color: 'var(--navy)', fontWeight: 500 }}>No active students in this class</div>
                <div style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>All students may have already been promoted.</div>
              </div>
            ) : (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>

                {/* Table header + quick actions */}
                <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, background: 'var(--gold-pale)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Users size={14} color="var(--gold)" />
                    <span style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>
                      {students.length} students — {promoteCount} to {isJHS3 ? 'graduate' : 'promote'}, {repeatCount} to repeat
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => toggleAll('promote')} style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 7, border: `1px solid ${actionColor}`, background: actionBg, color: actionColor, cursor: 'pointer' }}>
                      All {isJHS3 ? 'Graduate' : 'Promote'}
                    </button>
                    <button onClick={() => toggleAll('repeat')} style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 7, border: '1px solid #b45309', background: 'rgba(180,83,9,0.07)', color: '#b45309', cursor: 'pointer' }}>
                      All Repeat
                    </button>
                  </div>
                </div>

                {/* Scroll wrapper — grid is 400px+ wide, needs scroll on mobile */}
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
                  <div style={{ minWidth: 420 }}>
                    {/* Column headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 80px 70px 180px', gap: 8, padding: '9px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                      {['#', 'Student', 'ID', 'Avg', 'Decision'].map(h => (
                        <div key={h} style={{ fontFamily: 'system-ui', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</div>
                      ))}
                    </div>

                    {students.map((s, i) => {
                      const d = decisions[s.id] ?? 'promote'
                      const avg = avgScores[s.id]
                      const avgColor = avg == null ? 'var(--text-muted)' : avg >= 70 ? '#15803d' : avg >= 50 ? '#b45309' : '#b91c1c'
                      return (
                        <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 80px 70px 180px', gap: 8, padding: '10px 20px', alignItems: 'center', borderBottom: i < students.length - 1 ? '1px solid var(--border-soft)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(201,168,76,0.015)' }}>
                          <div style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-muted)' }}>{i + 1}</div>
                          <div style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 5 }}>{s.studentId}</div>
                          <div style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 700, color: avgColor }}>{avg != null ? `${avg.toFixed(1)}%` : '—'}</div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => setDecisions(prev => ({ ...prev, [s.id]: 'promote' }))}
                              style={{ flex: 1, padding: '5px 0', borderRadius: 7, border: `1.5px solid ${d === 'promote' ? actionColor : 'var(--border)'}`, background: d === 'promote' ? actionBg : 'transparent', color: d === 'promote' ? actionColor : 'var(--text-muted)', fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.12s' }}
                            >
                              {isJHS3 ? '🎓 Graduate' : '↑ Promote'}
                            </button>
                            <button
                              onClick={() => setDecisions(prev => ({ ...prev, [s.id]: 'repeat' }))}
                              style={{ flex: 1, padding: '5px 0', borderRadius: 7, border: `1.5px solid ${d === 'repeat' ? '#b45309' : 'var(--border)'}`, background: d === 'repeat' ? 'rgba(180,83,9,0.07)' : 'transparent', color: d === 'repeat' ? '#b45309' : 'var(--text-muted)', fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.12s' }}
                            >
                              ↺ Repeat
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Confirm + Apply */}
            {students.length > 0 && !result && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 22px' }}>
                {!confirmed ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <AlertCircle size={16} color="#b45309" />
                    <div style={{ flex: 1, fontFamily: 'system-ui', fontSize: 13, color: 'var(--navy)' }}>
                      <strong>Review carefully before applying.</strong> This will move {promoteCount} student(s) {isJHS3 ? 'to graduated status' : `to ${nextClass}`} and leave {repeatCount} student(s) in {selectedClass?.name}.
                    </div>
                    <button
                      onClick={() => setConfirmed(true)}
                      disabled={!isJHS3 && !nextClassObj}
                      style={{ padding: '9px 20px', background: 'var(--navy)', color: 'var(--gold-pale)', border: 'none', borderRadius: 9, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: (!isJHS3 && !nextClassObj) ? 'not-allowed' : 'pointer', opacity: (!isJHS3 && !nextClassObj) ? 0.5 : 1 }}
                    >
                      Review & Confirm
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 700, color: '#b91c1c', marginBottom: 12 }}>
                      ⚠ This action cannot be undone. Confirm to proceed:
                    </div>
                    <div style={{ fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                      • <strong>{promoteCount}</strong> student(s) will {isJHS3 ? 'be graduated (status → graduated)' : `move to ${nextClass}`}<br />
                      • <strong>{repeatCount}</strong> student(s) will stay in <strong>{selectedClass?.name}</strong> and repeat
                    </div>
                    {error && <div style={{ marginBottom: 12, fontFamily: 'system-ui', fontSize: 13, color: '#b91c1c', fontWeight: 600 }}>{error}</div>}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={applyPromotion} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: saving ? 'var(--surface-2)' : '#15803d', color: saving ? 'var(--text-muted)' : '#fff', border: saving ? '1px solid var(--border)' : 'none', borderRadius: 9, fontFamily: 'system-ui', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                        <GraduationCap size={15} />{saving ? 'Applying…' : 'Apply Promotion'}
                      </button>
                      <button onClick={() => setConfirmed(false)} disabled={saving} style={{ padding: '10px 18px', background: 'none', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 9, fontFamily: 'system-ui', fontSize: 13, cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Result banner */}
            {result && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 12, padding: '16px 20px', flexWrap: 'wrap' }}>
                <CheckCircle size={20} color="#15803d" />
                <div style={{ flex: 1, fontFamily: 'system-ui', fontSize: 13, color: '#15803d', fontWeight: 600 }}>
                  Promotion applied successfully!
                </div>
                <div style={{ display: 'flex', gap: 16, fontFamily: 'system-ui', fontSize: 12 }}>
                  {result.promoted > 0 && <span style={{ color: '#15803d', fontWeight: 700 }}>{result.promoted} promoted</span>}
                  {result.graduated > 0 && <span style={{ color: '#7c3aed', fontWeight: 700 }}>{result.graduated} graduated</span>}
                  {result.repeated > 0 && <span style={{ color: '#b45309', fontWeight: 700 }}>{result.repeated} repeating</span>}
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!classId && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '48px 20px', textAlign: 'center' }}>
            <GraduationCap size={28} color="var(--navy)" style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4 }} />
            <div style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 500, color: 'var(--navy)', marginBottom: 4 }}>Select a class to begin</div>
            <div style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-muted)' }}>Run this at the end of Term 3 after final results are entered</div>
          </div>
        )}

      </div>
    </div>
    </RoleGuard>
  )
}
