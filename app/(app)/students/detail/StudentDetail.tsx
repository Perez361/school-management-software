'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, FileText, Receipt, ArrowRightLeft, CheckCircle2 } from 'lucide-react'
import { api, Student, ResultRow, Payment, Class } from '@/lib/api'

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
  const [classes, setClasses] = useState<Class[]>([])
  const [transferring, setTransferring] = useState(false)
  const [newClassId, setNewClassId] = useState('')
  const [transferSaving, setTransferSaving] = useState(false)
  const [transferDone, setTransferDone] = useState(false)

  useEffect(() => {
    Promise.all([
      api.getStudent(studentId),
      api.getResults({ studentId }),
      api.getPayments(),
      api.getClasses(),
    ]).then(([s, r, p, cls]) => {
      setStudent(s)
      setResults(r)
      setPayments(p.filter(pay => pay.studentId === studentId))
      setClasses(cls)
    }).finally(() => setLoading(false))
  }, [studentId])

  async function handleTransfer() {
    if (!newClassId || !student) return
    setTransferSaving(true)
    try {
      const updated = await api.updateStudent(student.id, { classId: parseInt(newClassId) })
      setStudent(prev => prev ? { ...prev, classId: updated.classId, class: updated.class } : prev)
      setTransferDone(true)
      setTransferring(false)
      setTimeout(() => setTransferDone(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setTransferSaving(false)
    }
  }

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
      <div style={{ padding: 'clamp(16px,4vw,28px) clamp(16px,4vw,32px) clamp(14px,3vw,24px)', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <Link href="/students" style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textDecoration: 'none', flexShrink: 0 }}>
            <ArrowLeft size={16} />
          </Link>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
              <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Students</span>
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(18px,4vw,24px)', fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.name}</h1>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{student.studentId}</div>
          </div>
        </div>
        <Link href={`/students/edit?id=${student.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: 'var(--surface)', color: 'var(--navy)', border: '1px solid var(--border)', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Edit size={15} /> Edit Student
        </Link>
      </div>

      <div style={{ padding: 'clamp(12px,3vw,24px) clamp(16px,4vw,32px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, alignItems: 'start' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', alignSelf: 'start' }}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--gold-pale)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>
              {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>{student.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ background: 'rgba(139,26,26,0.07)', color: 'var(--navy)', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
                {transferDone ? <span style={{ color: '#15803d' }}>✓ Transferred</span> : student.class?.name}
              </span>
              {!transferring && (
                <button onClick={() => { setTransferring(true); setNewClassId(String(student.classId)) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontFamily: 'system-ui', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                  <ArrowRightLeft size={10} /> Transfer
                </button>
              )}
            </div>
            {transferring && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <select value={newClassId} onChange={e => setNewClassId(e.target.value)} style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface-2)', fontFamily: 'system-ui', fontSize: 12, color: 'var(--text-primary)', outline: 'none' }}>
                  <option value="">Select class</option>
                  {classes.filter(c => c.id !== student.classId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={handleTransfer} disabled={!newClassId || transferSaving} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: 'var(--navy)', color: 'var(--gold-pale)', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, cursor: !newClassId || transferSaving ? 'not-allowed' : 'pointer' }}>
                  {transferSaving ? '…' : 'Confirm'}
                </button>
                <button onClick={() => setTransferring(false)} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontFamily: 'system-ui', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              </div>
            )}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12 }}>
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
              <FileText size={15} color="var(--gold)" />
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Academic Results</span>
            </div>
            {Object.keys(groupedResults).length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-muted)' }}>No results recorded yet.</div>
            ) : Object.entries(groupedResults).map(([termYear, termResults]) => (
              <div key={termYear} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)' }}>
                <div style={{ fontFamily: 'system-ui', fontSize: 10, fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{termYear}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {termResults.map(r => {
                    const grade = getGrade(r.total)
                    const gradeColors: Record<string, string> = { A: '#15803d', B: '#C9A84C', C: '#8B1A1A', D: '#b45309', E: '#c2410c', F: '#b91c1c' }
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
