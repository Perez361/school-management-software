// app/(app)/results/page.tsx
import { prisma } from '@/lib/prisma'
import { rankStudents, getPositionSuffix } from '@/lib/grades'
import Link from 'next/link'
import { Plus, Trophy, BarChart2, ArrowRight } from 'lucide-react'

export default async function ResultsPage({
  searchParams
}: {
  searchParams: Promise<{ classId?: string; term?: string; year?: string }>
}) {
  const { classId: classIdParam, term: termParam, year: yearParam } = await searchParams
  const classId = classIdParam ? parseInt(classIdParam) : undefined
  const term = termParam || 'Term 1'
  const year = yearParam || '2024'

  const classes = await prisma.class.findMany({ orderBy: { name: 'asc' } })

  const results = await prisma.result.findMany({
    where: classId
      ? { term, year, student: { classId } }
      : { id: { lt: 0 } },
    include: { student: true, subject: true },
  })

  const studentMap: Record<number, { studentId: number; name: string; results: { total: number }[] }> = {}
  for (const r of results) {
    if (!studentMap[r.studentId]) {
      studentMap[r.studentId] = { studentId: r.studentId, name: r.student.name, results: [] }
    }
    studentMap[r.studentId].results.push({ total: r.total })
  }

  const rankings = rankStudents(Object.values(studentMap))

  const gradeDistribution = results.reduce((acc, r) => {
    acc[r.grade] = (acc[r.grade] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const avgScore = results.length > 0
    ? results.reduce((s, r) => s + r.total, 0) / results.length
    : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

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
            Results & Rankings
          </h1>
          <p style={{ fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-secondary)', marginTop: 5 }}>
            View and manage student examination results
          </p>
        </div>
        <Link href="/results/enter" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '10px 20px', background: 'var(--navy)', color: '#faf7f0',
          borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600,
          textDecoration: 'none', boxShadow: '0 2px 10px rgba(15,31,61,0.2)',
        }}>
          <Plus size={15} /> Enter Results
        </Link>
      </div>

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Filters */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px' }}>
          <form style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {[
              { name: 'classId', label: 'Class', default: classIdParam || '', options: [['', 'Select class'], ...classes.map(c => [String(c.id), c.name])], width: 160 },
              { name: 'term',    label: 'Term',  default: term, options: [['Term 1','Term 1'],['Term 2','Term 2'],['Term 3','Term 3']], width: 120 },
              { name: 'year',    label: 'Year',  default: year, options: [['2024','2024'],['2023','2023'],['2025','2025']], width: 100 },
            ].map(({ name, label, default: def, options, width }) => (
              <div key={name}>
                <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, letterSpacing: '0.04em' }}>{label}</label>
                <select name={name} defaultValue={def} style={{
                  width, padding: '9px 13px', background: 'var(--surface-2)', border: '1.5px solid var(--border)',
                  borderRadius: 9, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none',
                }}>
                  {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
            <button type="submit" style={{
              padding: '9px 20px', background: 'var(--navy)', color: '#faf7f0',
              border: 'none', borderRadius: 9, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              alignSelf: 'flex-end',
            }}>View Results</button>
          </form>
        </div>

        {!classId && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
            padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)',
          }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(217,119,6,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trophy size={26} color="#d97706" />
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>Select a class to view results</div>
            <div style={{ fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Choose a class, term, and year above to see rankings and scores</div>
            <Link href="/results/enter" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', background: 'var(--navy)', color: '#faf7f0',
              borderRadius: 9, textDecoration: 'none', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600,
            }}><Plus size={13} /> Enter Results</Link>
          </div>
        )}

        {classId && rankings.length === 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 500, marginBottom: 16 }}>No results found for this class, term and year</div>
            <Link href="/results/enter" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', background: 'var(--navy)', color: '#faf7f0',
              borderRadius: 9, textDecoration: 'none', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600,
            }}><Plus size={13} /> Enter Results Now</Link>
          </div>
        )}

        {rankings.length > 0 && (
          <>
            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Students Ranked', value: rankings.length, color: '#0f1f3d', bg: 'rgba(15,31,61,0.05)' },
                { label: 'Average Score', value: `${avgScore.toFixed(1)}%`, color: '#2563eb', bg: 'rgba(37,99,235,0.06)' },
                { label: 'Grade A Count', value: gradeDistribution['A'] || 0, color: '#15803d', bg: 'rgba(22,163,74,0.06)' },
                { label: 'Below Pass', value: (gradeDistribution['F'] || 0) + (gradeDistribution['E'] || 0), color: '#b91c1c', bg: 'rgba(185,28,28,0.05)' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>

              {/* Rankings panel */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '15px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trophy size={14} color="#d97706" />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Class Rankings</div>
                    <div style={{ fontFamily: 'system-ui', fontSize: 10, color: 'var(--text-muted)' }}>{term} · {year}</div>
                  </div>
                </div>
                <div>
                  {rankings.map((r, i) => {
                    const score = r.totalScore
                    const scoreColor = score >= 80 ? '#15803d' : score >= 60 ? '#2563eb' : score >= 40 ? '#d97706' : '#b91c1c'
                    const medals = ['🥇','🥈','🥉']
                    return (
                      <div key={r.studentId} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 18px',
                        borderBottom: i < rankings.length - 1 ? '1px solid var(--border-soft)' : 'none',
                        background: i === 0 ? 'rgba(201,168,76,0.04)' : 'transparent',
                      }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: i < 3 ? 'transparent' : 'var(--surface-2)',
                          fontSize: i < 3 ? 14 : 11,
                          fontFamily: 'system-ui', fontWeight: 700,
                          color: 'var(--text-muted)', flexShrink: 0,
                        }}>
                          {i < 3 ? medals[i] : r.position}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.name}
                          </div>
                          <div style={{ fontFamily: 'system-ui', fontSize: 10, color: 'var(--text-muted)' }}>{r.subjectCount} subjects</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: scoreColor }}>
                            {score.toFixed(1)}%
                          </div>
                          <div style={{ fontFamily: 'system-ui', fontSize: 10, color: 'var(--text-muted)' }}>{getPositionSuffix(r.position)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Scores table */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '15px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(37,99,235,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart2 size={14} color="#2563eb" />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Detailed Scores</div>
                    <div style={{ fontFamily: 'system-ui', fontSize: 10, color: 'var(--text-muted)' }}>{results.length} result entries</div>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'system-ui' }}>
                    <thead>
                      <tr style={{ background: 'var(--gold-pale)', borderBottom: '1px solid var(--border)' }}>
                        {['Student', 'Subject', 'CA (30)', 'Exam (70)', 'Total', 'Grade'].map(h => (
                          <th key={h} style={{
                            padding: '10px 16px', textAlign: 'left',
                            fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)',
                            letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => {
                        const gradeMeta: Record<string, { color: string; bg: string }> = {
                          A: { color: '#15803d', bg: 'rgba(22,163,74,0.08)' },
                          B: { color: '#1d4ed8', bg: 'rgba(37,99,235,0.07)' },
                          C: { color: '#0369a1', bg: 'rgba(3,105,161,0.07)' },
                          D: { color: '#b45309', bg: 'rgba(180,83,9,0.07)' },
                          E: { color: '#c2410c', bg: 'rgba(194,65,12,0.07)' },
                          F: { color: '#b91c1c', bg: 'rgba(185,28,28,0.07)' },
                        }
                        const gm = gradeMeta[r.grade] || gradeMeta.F
                        return (
                          <tr key={r.id} style={{ borderBottom: i < results.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                            <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{r.student.name}</td>
                            <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{r.subject.name}</td>
                            <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--navy)', fontWeight: 500 }}>{r.ca}</td>
                            <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--navy)', fontWeight: 500 }}>{r.exam}</td>
                            <td style={{ padding: '11px 16px' }}>
                              <span style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: r.total >= 60 ? '#15803d' : '#b91c1c' }}>
                                {r.total}
                              </span>
                            </td>
                            <td style={{ padding: '11px 16px' }}>
                              <span style={{
                                background: gm.bg, color: gm.color,
                                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                              }}>{r.grade}</span>
                            </td>
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