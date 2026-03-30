'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, FileText, Receipt } from 'lucide-react'
import { api, Student, ResultRow, Payment } from '@/lib/tauri'

function getGrade(total: number) {
  if (total >= 80) return 'A'
  if (total >= 70) return 'B'
  if (total >= 60) return 'C'
  if (total >= 50) return 'D'
  if (total >= 40) return 'E'
  return 'F'
}

export default function StudentDetail() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const studentId = parseInt(id)

  const [student, setStudent] = useState<Student | null>(null)
  const [results, setResults] = useState<ResultRow[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getStudent(studentId),
      api.getResults({ studentId }),
      api.getPayments(),
    ]).then(([s, r, p]) => {
      setStudent(s)
      setResults(r)
      setPayments(p.filter(pay => pay.studentId === studentId))
    }).finally(() => setLoading(false))
  }, [studentId])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui', color: 'var(--text-muted)' }}>
      Loading…
    </div>
  )

  if (!student) return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>Student not found.</div>
  )

  const groupedResults: Record<string, ResultRow[]> = {}
  for (const r of results) {
    const key = `${r.term} ${r.year}`
    if (!groupedResults[key]) groupedResults[key] = []
    groupedResults[key].push(r)
  }

  const totalPaid = payments.reduce((s, p) => s + p.paid, 0)
  const totalBalance = payments.reduce((s, p) => s + p.balance, 0)
  const totalBilled = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ padding: '28px 32px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/students" style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
              <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Students</span>
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>{student.name}</h1>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{student.studentId}</div>
          </div>
        </div>
        <Link href={`/students/edit?id=${student.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: 'var(--surface)', color: 'var(--navy)', border: '1px solid var(--border)', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          <Edit size={15} /> Edit Student
        </Link>
      </div>

      <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', alignSelf: 'start' }}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--gold-pale)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>
              {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>{student.name}</div>
            <span style={{ background: 'rgba(37,99,235,0.07)', color: '#1d4ed8', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{student.class?.name}</span>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {([
              ['Student ID', student.studentId],
              ['Gender', student.gender],
              ['Date of Birth', new Date(student.dob).toLocaleDateString('en-GH')],
              ['Phone', student.phone || '—'],
              ['Address', student.address || '—'],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
                <span style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: 'var(--navy)', textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
          {student.parent && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-soft)' }}>
              <div style={{ fontFamily: 'system-ui', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Parent / Guardian</div>
              <div style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{student.parent.name}</div>
              <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{student.parent.phone}</div>
              {student.parent.email && <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>{student.parent.email}</div>}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total Billed</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>GHS {totalBilled.toLocaleString()}</div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid #16a34a', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontFamily: 'system-ui', fontSize: 11, color: '#15803d', marginBottom: 4 }}>Total Paid</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>GHS {totalPaid.toLocaleString()}</div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid #dc2626', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontFamily: 'system-ui', fontSize: 11, color: '#b91c1c', marginBottom: 4 }}>Outstanding</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>GHS {totalBalance.toLocaleString()}</div>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={15} color="#2563eb" />
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Academic Results</span>
            </div>
            {Object.keys(groupedResults).length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-muted)' }}>No results recorded yet.</div>
            ) : Object.entries(groupedResults).map(([termYear, termResults]) => (
              <div key={termYear} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)' }}>
                <div style={{ fontFamily: 'system-ui', fontSize: 10, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{termYear}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {termResults.map(r => {
                    const grade = getGrade(r.total)
                    const gradeColors: Record<string, string> = { A: '#15803d', B: '#1d4ed8', C: '#0369a1', D: '#b45309', E: '#c2410c', F: '#b91c1c' }
                    return (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'system-ui', fontSize: 13, color: 'var(--navy)' }}>{r.subject?.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>CA: {r.ca} | Exam: {r.exam}</span>
                          <span style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--navy)', width: 32, textAlign: 'right' }}>{r.total}</span>
                          <span style={{ background: `${gradeColors[grade]}15`, color: gradeColors[grade], fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, width: 28, textAlign: 'center' }}>{grade}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Receipt size={15} color="#15803d" />
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Payment History</span>
            </div>
            {payments.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-muted)' }}>No payments recorded yet.</div>
            ) : payments.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: i < payments.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                <div>
                  <div style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{p.feeType}</div>
                  <div style={{ fontFamily: 'system-ui', fontSize: 11, color: 'var(--text-muted)' }}>{p.term} · {p.year}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: '#15803d' }}>GHS {p.paid.toFixed(2)}</div>
                  {p.balance > 0 && <div style={{ fontFamily: 'system-ui', fontSize: 11, color: '#b91c1c', fontWeight: 500 }}>Bal: GHS {p.balance.toFixed(2)}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
