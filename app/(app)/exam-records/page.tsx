'use client'
import { useState, useEffect, useCallback } from 'react'
import { Save, CheckCircle, BookOpen, Users, ClipboardList } from 'lucide-react'
import { api, Student, Subject, Class, CAScore } from '@/lib/api'
import { useLiveData } from '@/lib/live-data'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'system-ui', fontSize: 11, fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: 5, letterSpacing: '0.04em',
}
const selectStyle: React.CSSProperties = {
  width: '100%', padding: '9px 13px', background: 'var(--surface-2)',
  border: '1.5px solid var(--border)', borderRadius: 8,
  fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none',
}

export default function ExamRecordsPage() {
  const { can } = useAuth()
  const router = useRouter()
  useEffect(() => { if (!can('results')) router.replace('/dashboard') }, [can, router])

  const { version, bump } = useLiveData()
  const [classes,   setClasses]   = useState<Class[]>([])
  const [students,  setStudents]  = useState<Student[]>([])
  const [subjects,  setSubjects]  = useState<Subject[]>([])
  const [classId,   setClassId]   = useState('')
  const [term,      setTerm]      = useState('Term 1')
  const [year,      setYear]      = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [caScores,  setCAScores]  = useState<Record<number, number | null>>({})
  const [scores,    setScores]    = useState<Record<number, string>>({})
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    Promise.all([api.getClasses(), api.getSubjects(), api.getSettings()]).then(([c, s, settings]) => {
      setClasses(c); setSubjects(s)
      if (settings) { setTerm(settings.currentTerm); setYear(settings.currentYear) }
    })
  }, [version])

  useEffect(() => {
    if (!classId) { setStudents([]); setScores({}); setCAScores({}); return }
    api.getStudents({ classId: parseInt(classId) }).then(data => {
      setStudents(data)
      const init: Record<number, string> = {}
      data.forEach(s => { init[s.id] = '' })
      setScores(init)
    })
  }, [classId])

  const loadData = useCallback(() => {
    if (!classId || !subjectId) return
    const cid = parseInt(classId)
    const sid = parseInt(subjectId)
    Promise.all([
      api.getCAScores({ classId: cid, subjectId: sid, term, year }),
      api.getResults({ classId: cid, term, year }),
    ]).then(([caRows, resultRows]) => {
      const caMap: Record<number, number | null> = {}
      caRows.forEach(ca => { caMap[ca.studentId] = ca.computedCA ?? null })
      setCAScores(caMap)

      // Pre-fill existing exam scores (stored at 100-point scale); always start fresh per subject
      const updated: Record<number, string> = {}
      students.forEach(s => { updated[s.id] = '' })
      resultRows
        .filter(r => r.subjectId === sid)
        .forEach(r => { updated[r.studentId] = String(r.exam) })
      setScores(updated)
    })
  }, [classId, subjectId, term, year, students])

  useEffect(() => { loadData() }, [loadData])

  async function saveAll() {
    setSaving(true); setSaved(false); setError('')
    try {
      // Save students who have an exam score OR have a CA record (absent students get exam=0)
      const entries = Object.entries(scores).filter(([sid, v]) => {
        const hasExam = v.trim() !== ''
        const hasCA = caScores[parseInt(sid)] !== null && caScores[parseInt(sid)] !== undefined
        return hasExam || hasCA
      })
      await Promise.all(entries.map(([sid, examStr]) => {
        const studentId = parseInt(sid)
        const ca = caScores[studentId] ?? 0
        const exam = examStr.trim() !== '' ? parseFloat(examStr) : 0
        return api.upsertResult({ studentId, subjectId: parseInt(subjectId), term, year, ca, exam })
      }))
      setSaved(true)
      bump()
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setSaving(false)
    }
  }

  const filledCount = Object.entries(scores).filter(([sid, v]) => {
    const hasExam = v.trim() !== ''
    const hasCA = caScores[parseInt(sid)] !== null && caScores[parseInt(sid)] !== undefined
    return hasExam || hasCA
  }).length
  const caLoadedCount = Object.values(caScores).filter(v => v !== null).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* Header */}
      <div style={{ padding: 'clamp(16px,4vw,28px) clamp(16px,4vw,32px) clamp(14px,3vw,24px)', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
          <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Academics</span>
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Exam Records</h1>
        <p style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
          Enter end-of-term exam scores out of 100. CA is auto-loaded from Cumulative Assessments.
          Total = CA (/50) + Exam (/100 → /50) = 100.
        </p>
      </div>

      <div style={{ padding: 'clamp(12px,3vw,24px) clamp(16px,4vw,32px)', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Selectors */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 'clamp(14px,3vw,20px) clamp(16px,3vw,24px)' }}>
          <div style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Select Class & Subject</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14 }}>
            <div><label style={labelStyle}>Class *</label><select style={selectStyle} value={classId} onChange={e => setClassId(e.target.value)}><option value="">Select class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label style={labelStyle}>Subject *</label><select style={selectStyle} value={subjectId} onChange={e => setSubjectId(e.target.value)}><option value="">Select subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}</select></div>
            <div><label style={labelStyle}>Term *</label><select style={selectStyle} value={term} onChange={e => setTerm(e.target.value)}><option>Term 1</option><option>Term 2</option><option>Term 3</option></select></div>
            <div><label style={labelStyle}>Year *</label><input style={selectStyle} value={year} onChange={e => setYear(e.target.value)} placeholder="e.g. 2024/2025" /></div>
          </div>
        </div>

        {/* CA status banner */}
        {classId && subjectId && students.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: caLoadedCount > 0 ? 'rgba(201,168,76,0.07)' : 'rgba(217,119,6,0.06)', border: `1px solid ${caLoadedCount > 0 ? 'rgba(201,168,76,0.25)' : 'rgba(217,119,6,0.2)'}`, borderRadius: 10 }}>
            <ClipboardList size={15} color={caLoadedCount > 0 ? 'var(--gold)' : '#d97706'} />
            <span style={{ fontFamily: 'system-ui', fontSize: 12, color: caLoadedCount > 0 ? 'var(--navy)' : '#92400e', fontWeight: 500 }}>
              {caLoadedCount > 0
                ? <><strong>{caLoadedCount}</strong> of {students.length} students have CA scores (out of 50) auto-loaded</>
                : <>No CA scores found — <a href="/ca-scores" style={{ color: 'var(--navy)', fontWeight: 700 }}>enter CA scores first</a></>
              }
            </span>
          </div>
        )}

        {/* Score grid */}
        {students.length > 0 && subjectId ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>

            {/* Toolbar */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139,26,26,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={14} color="var(--gold)" />
                </div>
                <div>
                  <div style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{students.length} students</div>
                  <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>{filledCount} scores entered</div>
                </div>
                <div style={{ width: 100, height: 4, background: 'var(--border-soft)', borderRadius: 2, overflow: 'hidden', marginLeft: 6 }}>
                  <div style={{ width: `${students.length ? (filledCount / students.length) * 100 : 0}%`, height: '100%', background: 'var(--navy)', borderRadius: 2 }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {saved && <span style={{ fontFamily: 'system-ui', fontSize: 12, color: '#15803d', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}><CheckCircle size={14} /> Saved!</span>}
                {error && <span style={{ fontFamily: 'system-ui', fontSize: 12, color: '#b91c1c' }}>{error}</span>}
                <button
                  onClick={saveAll}
                  disabled={saving || filledCount === 0}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: filledCount === 0 ? 'var(--surface-2)' : 'var(--navy)', color: filledCount === 0 ? 'var(--text-muted)' : 'var(--gold-pale)', border: filledCount === 0 ? '1px solid var(--border)' : 'none', borderRadius: 9, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: filledCount === 0 ? 'not-allowed' : 'pointer' }}
                >
                  <Save size={14} />{saving ? 'Saving…' : `Save ${filledCount > 0 ? filledCount : ''} Record${filledCount !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
              <div style={{ minWidth: 580 }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 110px 110px 130px 80px', gap: 10, padding: '10px 20px', background: 'var(--gold-pale)', borderBottom: '1px solid var(--border)' }}>
                  {['#', 'Student Name', 'Student ID', 'CA /50', 'Exam /100', 'Total /100'].map(h => (
                    <div key={h} style={{ fontFamily: 'system-ui', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</div>
                  ))}
                </div>

                {students.map((s, i) => {
                  const examStr = scores[s.id] ?? ''
                  const ca      = caScores[s.id] ?? null
                  const exam    = parseFloat(examStr)
                  // Total = CA (0–50) + Exam/2 (0–50)
                  const caVal   = ca ?? 0
                  const examVal = !isNaN(exam) ? exam : 0
                  // Show total if exam entered OR if student has a CA (absent = exam 0)
                  const total   = (!isNaN(exam) || ca !== null) ? Math.round((caVal + examVal / 2) * 100) / 100 : null
                  const totalColor = total === null ? 'var(--text-muted)' : total >= 80 ? '#15803d' : total >= 60 ? '#C9A84C' : total >= 40 ? '#d97706' : '#b91c1c'
                  const totalBg    = total === null ? 'var(--surface-2)' : total >= 80 ? 'rgba(22,163,74,0.08)' : total >= 60 ? 'rgba(139,26,26,0.07)' : total >= 40 ? 'rgba(217,119,6,0.07)' : 'rgba(185,28,28,0.07)'

                  return (
                    <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 110px 110px 130px 80px', gap: 10, padding: '10px 20px', alignItems: 'center', borderBottom: i < students.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                      <div style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{i + 1}</div>
                      <div style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 5, width: 'fit-content' }}>{s.studentId}</div>

                      {/* CA — read-only */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {ca !== null
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: 'var(--navy)', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', padding: '4px 10px', borderRadius: 8 }}>
                              {ca}
                              <span style={{ fontSize: 9, fontFamily: 'system-ui', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>CA</span>
                            </span>
                          : <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>no CA</span>
                        }
                      </div>

                      {/* Exam — editable, 0–100 */}
                      <input
                        type="number" min="0" max="100" step="0.5"
                        value={examStr}
                        onChange={e => setScores(prev => ({ ...prev, [s.id]: e.target.value }))}
                        placeholder="0 – 100"
                        style={{ width: '100%', padding: '7px 10px', textAlign: 'center', background: 'var(--surface-2)', border: `1.5px solid ${examStr !== '' ? 'var(--navy)' : 'var(--border)'}`, borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }}
                      />

                      {/* Total /100 preview */}
                      <div style={{ textAlign: 'center' }}>
                        {total !== null
                          ? <span style={{ display: 'inline-block', fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: totalColor, background: totalBg, padding: '3px 8px', borderRadius: 7, minWidth: 44, textAlign: 'center' }}>{total}</span>
                          : <span style={{ color: 'var(--border)', fontSize: 16 }}>—</span>
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

        ) : classId && !subjectId ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '48px 20px', textAlign: 'center' }}>
            <BookOpen size={20} color="var(--gold)" style={{ display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 500, color: 'var(--navy)' }}>Select a subject</div>
          </div>
        ) : !classId ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '48px 20px', textAlign: 'center' }}>
            <Users size={20} color="var(--navy)" style={{ display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 500, color: 'var(--navy)' }}>Select a class and subject to begin</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
