'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trophy, BarChart2 } from 'lucide-react'
import { api, Class, ResultRow } from '@/lib/tauri'

function rankStudents(results: ResultRow[]) {
  const map: Record<number, { studentId: number; name: string; total: number; count: number }> = {}
  for (const r of results) {
    if (!map[r.studentId]) map[r.studentId] = { studentId: r.studentId, name: r.student?.name ?? '', total: 0, count: 0 }
    map[r.studentId].total += r.total
    map[r.studentId].count++
  }
  const arr = Object.values(map).map(s => ({ ...s, avg: s.count > 0 ? s.total / s.count : 0 }))
  arr.sort((a, b) => b.avg - a.avg)
  return arr.map((s, i) => ({ ...s, position: i + 1 }))
}

function getPositionSuffix(n: number) {
  const s = ['th','st','nd','rd']; const v = n % 100
  return n + (s[(v-20)%10] || s[v] || s[0])
}

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const [classes, setClasses] = useState<Class[]>([])
  const [results, setResults] = useState<ResultRow[]>([])
  const [loading, setLoading] = useState(false)

  const [classId, setClassId] = useState(searchParams.get('classId') ?? '')
  const [term, setTerm] = useState(searchParams.get('term') ?? 'Term 1')
  const [year, setYear] = useState(searchParams.get('year') ?? '2024')

  useEffect(() => { api.getClasses().then(setClasses) }, [])

  const loadResults = useCallback(async () => {
    if (!classId) return
    setLoading(true)
    try {
      const r = await api.getResults({ classId: parseInt(classId), term, year })
      setResults(r)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [classId, term, year])

  useEffect(() => { loadResults() }, [loadResults])

  const rankings = rankStudents(results)
  const gradeDistribution = results.reduce((acc, r) => { acc[r.grade] = (acc[r.grade] || 0) + 1; return acc }, {} as Record<string, number>)
  const avgScore = results.length > 0 ? results.reduce((s, r) => s + r.total, 0) / results.length : 0

  function handleFilter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setClassId(fd.get('classId') as string ?? '')
    setTerm(fd.get('term') as string ?? 'Term 1')
    setYear(fd.get('year') as string ?? '2024')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ padding: '28px 32px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}><div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} /><span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Academics</span></div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Results & Rankings</h1>
          <p style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)', marginTop: 5 }}>View and manage student examination results</p>
        </div>
        <Link href="/results/enter" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: 'var(--navy)', color: '#faf7f0', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, textDecoration: 'none', boxShadow: '0 2px 10px rgba(15,31,61,0.2)' }}>
          <Plus size={15} /> Enter Results
        </Link>
      </div>

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Filters */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px' }}>
          <form onSubmit={handleFilter} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {[
              { name: 'classId', label: 'Class', value: classId, options: [['', 'Select class'], ...classes.map(c => [String(c.id), c.name])], width: 160 },
              { name: 'term', label: 'Term', value: term, options: [['Term 1','Term 1'],['Term 2','Term 2'],['Term 3','Term 3']], width: 120 },
              { name: 'year', label: 'Year', value: year, options: [['2024','2024'],['2023','2023'],['2025','2025']], width: 100 },
            ].map(({ name, label, value, options, width }) => (
              <div key={name}>
                <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, letterSpacing: '0.04em' }}>{label}</label>
                <select name={name} defaultValue={value} style={{ width, padding: '9px 13px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 9, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }}>
                  {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
            <button type="submit" style={{ padding: '9px 20px', background: 'var(--navy)', color: '#faf7f0', border: 'none', borderRadius: 9, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end' }}>View Results</button>
          </form>
        </div>

        {!classId ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Trophy size={26} color="#d97706" style={{ display: 'block', margin: '0 auto 16px' }} />
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>Select a class to view results</div>
            <div style={{ fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-muted)' }}>Choose a class, term, and year above to see rankings and scores</div>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'system-ui', color: 'var(--text-muted)' }}>Loading…</div>
        ) : rankings.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 500, marginBottom: 16 }}>No results found for this class, term and year</div>
            <Link href="/results/enter" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--navy)', color: '#faf7f0', borderRadius: 9, textDecoration: 'none', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600 }}><Plus size={13} /> Enter Results Now</Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Students Ranked', value: rankings.length, color: '#0f1f3d' },
                { label: 'Average Score', value: `${avgScore.toFixed(1)}%`, color: '#2563eb' },
                { label: 'Grade A Count', value: gradeDistribution['A'] || 0, color: '#15803d' },
                { label: 'Below Pass', value: (gradeDistribution['F'] || 0) + (gradeDistribution['E'] || 0), color: '#b91c1c' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
              {/* Rankings */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '15px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Trophy size={14} color="#d97706" />
                  <div><div style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Class Rankings</div><div style={{ fontFamily: 'system-ui', fontSize: 10, color: 'var(--text-muted)' }}>{term} · {year}</div></div>
                </div>
                {rankings.map((r, i) => {
                  const medals = ['🥇','🥈','🥉']
                  const scoreColor = r.avg >= 80 ? '#15803d' : r.avg >= 60 ? '#2563eb' : r.avg >= 40 ? '#d97706' : '#b91c1c'
                  return (
                    <div key={r.studentId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 18px', borderBottom: i < rankings.length - 1 ? '1px solid var(--border-soft)' : 'none', background: i === 0 ? 'rgba(201,168,76,0.04)' : 'transparent' }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i < 3 ? 14 : 11, fontFamily: 'system-ui', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
                        {i < 3 ? medals[i] : r.position}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                        <div style={{ fontFamily: 'system-ui', fontSize: 10, color: 'var(--text-muted)' }}>{r.count} subject{r.count !== 1 ? 's' : ''}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: scoreColor }}>{r.avg.toFixed(1)}%</div>
                        <div style={{ fontFamily: 'system-ui', fontSize: 10, color: 'var(--text-muted)' }}>{getPositionSuffix(r.position)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Detailed scores */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '15px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 9 }}>
                  <BarChart2 size={14} color="#2563eb" />
                  <div><div style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Detailed Scores</div><div style={{ fontFamily: 'system-ui', fontSize: 10, color: 'var(--text-muted)' }}>{results.length} result entries</div></div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'system-ui' }}>
                    <thead>
                      <tr style={{ background: 'var(--gold-pale)', borderBottom: '1px solid var(--border)' }}>
                        {['Student','Subject','CA (30)','Exam (70)','Total','Grade'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => {
                        const gradeMeta: Record<string, { color: string; bg: string }> = { A:{color:'#15803d',bg:'rgba(22,163,74,0.08)'}, B:{color:'#1d4ed8',bg:'rgba(37,99,235,0.07)'}, C:{color:'#0369a1',bg:'rgba(3,105,161,0.07)'}, D:{color:'#b45309',bg:'rgba(180,83,9,0.07)'}, E:{color:'#c2410c',bg:'rgba(194,65,12,0.07)'}, F:{color:'#b91c1c',bg:'rgba(185,28,28,0.07)'} }
                        const gm = gradeMeta[r.grade] || gradeMeta['F']
                        return (
                          <tr key={r.id} style={{ borderBottom: i < results.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                            <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{r.student?.name}</td>
                            <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{r.subject?.name}</td>
                            <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--navy)', fontWeight: 500 }}>{r.ca}</td>
                            <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--navy)', fontWeight: 500 }}>{r.exam}</td>
                            <td style={{ padding: '11px 16px' }}><span style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: r.total >= 60 ? '#15803d' : '#b91c1c' }}>{r.total}</span></td>
                            <td style={{ padding: '11px 16px' }}><span style={{ background: gm.bg, color: gm.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{r.grade}</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
