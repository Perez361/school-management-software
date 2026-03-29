'use client'
// src/app/results/enter/page.tsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, CheckCircle } from 'lucide-react'

interface Student { id: number; name: string; studentId: string }
interface Subject { id: number; name: string; code: string }
interface Class   { id: number; name: string }

export default function EnterResultsPage() {
  const [classes, setClasses]   = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])

  const [classId, setClassId]   = useState('')
  const [term, setTerm]         = useState('Term 1')
  const [year, setYear]         = useState('2024')
  const [subjectId, setSubjectId] = useState('')

  // scores[studentId] = { ca, exam }
  const [scores, setScores] = useState<Record<number, { ca: string; exam: string }>>({})
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')

  useEffect(() => {
    fetch('/api/classes').then(r => r.json()).then(setClasses)
    fetch('/api/subjects').then(r => r.json()).then(setSubjects)
  }, [])

  useEffect(() => {
    if (!classId) { setStudents([]); return }
    fetch(`/api/students?classId=${classId}`).then(r => r.json()).then((data: Student[]) => {
      setStudents(data)
      const init: Record<number, { ca: string; exam: string }> = {}
      data.forEach(s => { init[s.id] = { ca: '', exam: '' } })
      setScores(init)
    })
  }, [classId])

  // Load existing scores when subjectId changes
  useEffect(() => {
    if (!classId || !subjectId || !term || !year) return
    fetch(`/api/results?classId=${classId}&term=${term}&year=${year}`)
      .then(r => r.json())
      .then((results: any[]) => {
        const filtered = results.filter(r => r.subjectId === parseInt(subjectId))
        const updated: Record<number, { ca: string; exam: string }> = {}
        students.forEach(s => { updated[s.id] = { ca: '', exam: '' } })
        filtered.forEach(r => {
          updated[r.studentId] = { ca: String(r.ca), exam: String(r.exam) }
        })
        setScores(updated)
      })
  }, [subjectId, term, year])

  async function saveAll() {
    setSaving(true); setSaved(false); setError('')
    try {
      const entries = Object.entries(scores).filter(([_, v]) => v.ca !== '' && v.exam !== '')
      await Promise.all(entries.map(([sid, { ca, exam }]) =>
        fetch('/api/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: sid, subjectId, term, year, ca, exam }),
        })
      ))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/results" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">Enter Results</h1>
            <p className="text-sm text-slate-500">Input CA and Exam scores per subject</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Selectors */}
        <div className="card p-5">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="label">Class *</label>
              <select className="input" value={classId} onChange={e => setClassId(e.target.value)}>
                <option value="">Select class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Subject *</label>
              <select className="input" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Term *</label>
              <select className="input" value={term} onChange={e => setTerm(e.target.value)}>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>
            <div>
              <label className="label">Year *</label>
              <select className="input" value={year} onChange={e => setYear(e.target.value)}>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>
        </div>

        {/* Score Entry Table */}
        {students.length > 0 && subjectId && (
          <div className="card">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-800">
                Enter scores — {students.length} students
              </h3>
              <div className="flex items-center gap-3">
                {saved && (
                  <span className="text-green-600 text-sm flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Saved successfully!
                  </span>
                )}
                {error && <span className="text-red-500 text-sm">{error}</span>}
                <button
                  onClick={saveAll}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save All Scores'}
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 gap-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 rounded-lg">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5">Student Name</div>
                  <div className="col-span-2">Student ID</div>
                  <div className="col-span-2">CA Score <span className="text-slate-400">(max 30)</span></div>
                  <div className="col-span-2">Exam Score <span className="text-slate-400">(max 70)</span></div>
                </div>

                {students.map((s, i) => {
                  const sc = scores[s.id] || { ca: '', exam: '' }
                  const total = sc.ca && sc.exam ? parseFloat(sc.ca) + parseFloat(sc.exam) : null
                  return (
                    <div
                      key={s.id}
                      className="grid grid-cols-12 gap-3 px-3 py-2 items-center rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="col-span-1 text-slate-400 text-sm">{i + 1}</div>
                      <div className="col-span-5 font-medium text-slate-800 text-sm">{s.name}</div>
                      <div className="col-span-2 font-mono text-xs text-slate-500">{s.studentId}</div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0" max="30"
                          value={sc.ca}
                          onChange={e => setScores(prev => ({
                            ...prev,
                            [s.id]: { ...prev[s.id], ca: e.target.value }
                          }))}
                          placeholder="0–30"
                          className="input text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0" max="70"
                            value={sc.exam}
                            onChange={e => setScores(prev => ({
                              ...prev,
                              [s.id]: { ...prev[s.id], exam: e.target.value }
                            }))}
                            placeholder="0–70"
                            className="input text-center"
                          />
                          {total !== null && (
                            <span className={`text-xs font-bold shrink-0 w-10 text-center py-1 rounded-md
                              ${total >= 80 ? 'bg-green-100 text-green-700' :
                                total >= 60 ? 'bg-blue-100 text-blue-700' :
                                total >= 40 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'}`}>
                              {total}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {!classId && (
          <div className="card p-12 text-center text-slate-400">
            <p>Select a class and subject to start entering scores.</p>
          </div>
        )}
        {classId && !subjectId && (
          <div className="card p-12 text-center text-slate-400">
            <p>Now select a subject to enter scores for.</p>
          </div>
        )}
      </div>
    </div>
  )
}
