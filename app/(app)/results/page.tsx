// app/results/page.tsx
import { prisma } from '@/lib/prisma'
import { rankStudents, getPositionSuffix } from '@/lib/grades'
import Link from 'next/link'
import { Plus, Trophy } from 'lucide-react'

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

  // Always call findMany so the return type is consistent (never [])
  const results = await prisma.result.findMany({
    where: classId
      ? { term, year, student: { classId } }
      : { id: { lt: 0 } }, // returns empty array with correct type
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

  const resultsByStudent: Record<number, typeof results> = {}
  for (const r of results) {
    if (!resultsByStudent[r.studentId]) resultsByStudent[r.studentId] = []
    resultsByStudent[r.studentId].push(r)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-header">
        <div>
          <h1 className="page-title">Results & Rankings</h1>
          <p className="text-sm text-slate-500">View and enter student examination results</p>
        </div>
        <Link href="/results/enter" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Enter Results
        </Link>
      </div>

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="card p-4">
          <form className="flex gap-4 flex-wrap">
            <div>
              <label className="label text-xs">Class</label>
              <select name="classId" defaultValue={classIdParam || ''} className="input w-44">
                <option value="">Select class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Term</label>
              <select name="term" defaultValue={term} className="input w-32">
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>
            <div>
              <label className="label text-xs">Year</label>
              <select name="year" defaultValue={year} className="input w-28">
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary">View Results</button>
            </div>
          </form>
        </div>

        {!classId && (
          <div className="card p-12 text-center text-slate-400">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Select a class to view rankings and results</p>
          </div>
        )}

        {classId && rankings.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <p>No results found for this class, term, and year.</p>
            <Link href="/results/enter" className="btn-primary mt-4 inline-flex">Enter Results</Link>
          </div>
        )}

        {rankings.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="card">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-sm text-slate-800">Class Rankings</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {rankings.map((r) => (
                  <div key={r.studentId} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                      ${r.position === 1 ? 'bg-amber-100 text-amber-700' :
                        r.position === 2 ? 'bg-slate-100 text-slate-600' :
                        r.position === 3 ? 'bg-orange-100 text-orange-600' :
                        'bg-slate-50 text-slate-500'}`}>
                      {r.position}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{r.name}</p>
                      <p className="text-xs text-slate-400">{r.subjectCount} subjects</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-brand-600">{r.totalScore.toFixed(1)}%</p>
                      <p className="text-xs text-slate-400">{getPositionSuffix(r.position)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card col-span-2">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="font-semibold text-sm text-slate-800">Detailed Scores</h3>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Subject</th>
                      <th>CA (30)</th>
                      <th>Exam (70)</th>
                      <th>Total</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <tr key={r.id}>
                        <td className="font-medium text-slate-800">{r.student.name}</td>
                        <td className="text-slate-500">{r.subject.name}</td>
                        <td>{r.ca}</td>
                        <td>{r.exam}</td>
                        <td className="font-semibold">{r.total}</td>
                        <td>
                          <span className={`badge ${r.grade === 'A' ? 'badge-green' :
                            r.grade === 'B' ? 'badge-blue' :
                            r.grade === 'F' ? 'badge-red' : 'badge-amber'}`}>
                            {r.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}