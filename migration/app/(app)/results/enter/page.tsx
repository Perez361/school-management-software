'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, CheckCircle, BookOpen, Users } from 'lucide-react'
import { api, Student, Subject, Class, ResultRow } from '@/lib/tauri'

const labelStyle: React.CSSProperties = { display: 'block', fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, letterSpacing: '0.04em' }
const selectStyle: React.CSSProperties = { width: '100%', padding: '9px 13px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }

export default function EnterResultsPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classId, setClassId] = useState('')
  const [term, setTerm] = useState('Term 1')
  const [year, setYear] = useState('2024')
  const [subjectId, setSubjectId] = useState('')
  const [scores, setScores] = useState<Record<number, { ca: string; exam: string }>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.getClasses(), api.getSubjects()]).then(([c, s]) => { setClasses(c); setSubjects(s) })
  }, [])

  useEffect(() => {
    if (!classId) { setStudents([]); return }
    api.getStudents({ classId: parseInt(classId) }).then(data => {
      setStudents(data)
      const init: Record<number, { ca: string; exam: string }> = {}
      data.forEach(s => { init[s.id] = { ca: '', exam: '' } })
      setScores(init)
    })
  }, [classId])

  useEffect(() => {
    if (!classId || !subjectId || !term || !year) return
    api.getResults({ classId: parseInt(classId), term, year }).then(results => {
      const filtered = results.filter(r => r.subjectId === parseInt(subjectId))
      const updated: Record<number, { ca: string; exam: string }> = {}
      students.forEach(s => { updated[s.id] = { ca: '', exam: '' } })
      filtered.forEach(r => { updated[r.studentId] = { ca: String(r.ca), exam: String(r.exam) } })
      setScores(updated)
    })
  }, [subjectId, term, year, classId])

  async function saveAll() {
    setSaving(true); setSaved(false); setError('')
    try {
      const entries = Object.entries(scores).filter(([, v]) => v.ca !== '' && v.exam !== '')
      await Promise.all(entries.map(([sid, { ca, exam }]) =>
        api.upsertResult({
          studentId: parseInt(sid),
          subjectId: parseInt(subjectId),
          term, year,
          ca: parseFloat(ca),
          exam: parseFloat(exam),
        })
      ))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) { setError(e.message || String(e)) }
    finally { setSaving(false) }
  }

  const filledCount = Object.values(scores).filter(v => v.ca !== '' && v.exam !== '').length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ padding: '28px 32px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Link href="/results" style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textDecoration: 'none' }}><ArrowLeft size={16} /></Link>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
            <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Academics</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Enter Results</h1>
        </div>
      </div>

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Select Class & Subject</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <div><label style={labelStyle}>Class *</label><select style={selectStyle} value={classId} onChange={e => setClassId(e.target.value)}><option value="">Select class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label style={labelStyle}>Subject *</label><select style={selectStyle} value={subjectId} onChange={e => setSubjectId(e.target.value)}><option value="">Select subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}</select></div>
            <div><label style={labelStyle}>Term *</label><select style={selectStyle} value={term} onChange={e => setTerm(e.target.value)}><option>Term 1</option><option>Term 2</option><option>Term 3</option></select></div>
            <div><label style={labelStyle}>Year *</label><select style={selectStyle} value={year} onChange={e => setYear(e.target.value)}><option>2024</option><option>2023</option><option>2025</option></select></div>
          </div>
        </div>

        {students.length > 0 && subjectId ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(37,99,235,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={14} color="#2563eb" /></div>
                <div>
                  <div style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{students.length} students</div>
                  <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>{filledCount} of {students.length} scores entered</div>
                </div>
                <div style={{ width: 120, height: 4, background: 'var(--border-soft)', borderRadius: 2, overflow: 'hidden', marginLeft: 6 }}>
                  <div style={{ width: `${students.length ? (filledCount / students.length) * 100 : 0}%`, height: '100%', background: '#2563eb', borderRadius: 2 }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {saved && <span style={{ fontFamily: 'system-ui', fontSize: 12, color: '#15803d', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}><CheckCircle size={14} /> Saved!</span>}
                {error && <span style={{ fontFamily: 'system-ui', fontSize: 12, color: '#b91c1c' }}>{error}</span>}
                <button onClick={saveAll} disabled={saving || filledCount === 0} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: filledCount === 0 ? 'var(--surface-2)' : 'var(--navy)', color: filledCount === 0 ? 'var(--text-muted)' : '#faf7f0', border: filledCount === 0 ? '1px solid var(--border)' : 'none', borderRadius: 9, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: filledCount === 0 ? 'not-allowed' : 'pointer' }}>
                  <Save size={14} />{saving ? 'Saving…' : `Save ${filledCount > 0 ? filledCount : ''} Score${filledCount !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 120px 110px 110px 56px', gap: 12, padding: '10px 20px', background: 'var(--gold-pale)', borderBottom: '1px solid var(--border)' }}>
              {['#','Student Name','Student ID','CA (max 30)','Exam (max 70)','Total'].map(h => <div key={h} style={{ fontFamily: 'system-ui', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</div>)}
            </div>
            {students.map((s, i) => {
              const sc = scores[s.id] || { ca: '', exam: '' }
              const ca = parseFloat(sc.ca); const exam = parseFloat(sc.exam)
              const total = !isNaN(ca) && !isNaN(exam) ? ca + exam : null
              const totalColor = total === null ? 'var(--text-muted)' : total >= 80 ? '#15803d' : total >= 60 ? '#2563eb' : total >= 40 ? '#d97706' : '#b91c1c'
              const totalBg = total === null ? 'var(--surface-2)' : total >= 80 ? 'rgba(22,163,74,0.08)' : total >= 60 ? 'rgba(37,99,235,0.07)' : total >= 40 ? 'rgba(217,119,6,0.07)' : 'rgba(185,28,28,0.07)'
              return (
                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 120px 110px 110px 56px', gap: 12, padding: '10px 20px', alignItems: 'center', borderBottom: i < students.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                  <div style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{i + 1}</div>
                  <div style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 5, width: 'fit-content' }}>{s.studentId}</div>
                  <input type="number" min="0" max="30" value={sc.ca} onChange={e => setScores(prev => ({ ...prev, [s.id]: { ...prev[s.id], ca: e.target.value } }))} placeholder="0 – 30" style={{ width: '100%', padding: '7px 10px', textAlign: 'center', background: 'var(--surface-2)', border: `1.5px solid ${sc.ca !== '' ? 'var(--navy)' : 'var(--border)'}`, borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }} />
                  <input type="number" min="0" max="70" value={sc.exam} onChange={e => setScores(prev => ({ ...prev, [s.id]: { ...prev[s.id], exam: e.target.value } }))} placeholder="0 – 70" style={{ width: '100%', padding: '7px 10px', textAlign: 'center', background: 'var(--surface-2)', border: `1.5px solid ${sc.exam !== '' ? 'var(--navy)' : 'var(--border)'}`, borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }} />
                  <div style={{ textAlign: 'center' }}>
                    {total !== null ? <span style={{ display: 'inline-block', fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: totalColor, background: totalBg, padding: '3px 8px', borderRadius: 7, minWidth: 40, textAlign: 'center' }}>{total}</span>
                      : <span style={{ color: 'var(--border)', fontSize: 16 }}>—</span>}
                  </div>
                </div>
              )
            })}
          </div>
        ) : classId && !subjectId ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <BookOpen size={20} color="#2563eb" style={{ display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 500, color: 'var(--navy)', marginBottom: 4 }}>Select a subject</div>
          </div>
        ) : !classId ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={20} color="var(--navy)" style={{ display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 500, color: 'var(--navy)', marginBottom: 4 }}>Select a class and subject to begin</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
