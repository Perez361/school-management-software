// ─────────────────────────────────────────────
// app/(app)/billing/new/page.tsx  (enhanced)
// ─────────────────────────────────────────────
'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Receipt } from 'lucide-react'

interface PaymentForm {
  studentId: string; term: string; year: string
  feeType: string; amount: string; paid: string
}

const inp: React.CSSProperties = { width: '100%', padding: '9px 13px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }
const lbl = (t: string, req = false) => <label style={{ display: 'block', fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{t}{req && <span style={{ color: '#b91c1c', marginLeft: 2 }}>*</span>}</label>

export default function NewPaymentPage() {
  const router = useRouter()
  const { register, handleSubmit, watch } = useForm<PaymentForm>({
    defaultValues: { term: 'Term 1', year: '2024', feeType: 'Tuition', amount: '1500', paid: '0' }
  })
  const [classes, setClasses] = useState<{id: number; name: string}[]>([])
  const [students, setStudents] = useState<{id: number; name: string; studentId: string}[]>([])
  const [classId, setClassId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const amount  = parseFloat(watch('amount') || '0')
  const paid    = parseFloat(watch('paid') || '0')
  const balance = isNaN(amount - paid) ? 0 : Math.max(0, amount - paid)
  const isFullyPaid = balance === 0 && paid > 0

  useEffect(() => { fetch('/api/classes').then(r => r.json()).then(setClasses) }, [])
  useEffect(() => {
    if (!classId) return
    fetch(`/api/students?classId=${classId}`).then(r => r.json()).then(setStudents)
  }, [classId])

  async function onSubmit(data: PaymentForm) {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error(await res.text())
      router.push('/billing')
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ padding: '28px 32px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/billing" style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textDecoration: 'none' }}><ArrowLeft size={16} /></Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 24, height: 3, background: 'var(--gold)', borderRadius: 2 }} />
              <span style={{ fontFamily: 'system-ui', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>Billing</span>
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Record Payment</h1>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: 9, padding: '8px 14px' }}>
          <Receipt size={14} color="#15803d" />
          <span style={{ fontFamily: 'system-ui', fontSize: 12, color: '#15803d', fontWeight: 600 }}>Fee transaction</span>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 680 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontFamily: 'system-ui', fontSize: 13, color: '#b91c1c' }}>{error}</div>}

          {/* Student selection */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border-soft)', background: 'var(--gold-pale)', fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Select Student</div>
            <div style={{ padding: '22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                {lbl('Filter by Class')}
                <select style={{ ...inp, cursor: 'pointer' } as React.CSSProperties} value={classId} onChange={e => setClassId(e.target.value)}>
                  <option value="">All classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                {lbl('Student', true)}
                <select {...register('studentId', { required: true })} style={{ ...inp, cursor: 'pointer' } as React.CSSProperties}>
                  <option value="">Select student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.studentId})</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Fee details */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border-soft)', background: 'var(--gold-pale)', fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Fee Details</div>
            <div style={{ padding: '22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                {lbl('Fee Type', true)}
                <select {...register('feeType', { required: true })} style={{ ...inp, cursor: 'pointer' } as React.CSSProperties}>
                  <option value="Tuition">Tuition</option>
                  <option value="PTA">PTA Levy</option>
                  <option value="Uniform">Uniform</option>
                  <option value="Books">Books & Supplies</option>
                  <option value="Exam">Exam Fees</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                {lbl('Term', true)}
                <select {...register('term', { required: true })} style={{ ...inp, cursor: 'pointer' } as React.CSSProperties}>
                  <option>Term 1</option><option>Term 2</option><option>Term 3</option>
                </select>
              </div>
              <div>
                {lbl('Total Amount (GHS)', true)}
                <input type="number" step="0.01" {...register('amount', { required: true })} style={inp} />
              </div>
              <div>
                {lbl('Amount Paid (GHS)', true)}
                <input type="number" step="0.01" {...register('paid', { required: true })} style={inp} />
              </div>
            </div>
          </div>

          {/* Balance preview */}
          <div style={{
            borderRadius: 12, padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 20,
            background: isFullyPaid ? 'rgba(22,163,74,0.07)' : 'rgba(217,119,6,0.07)',
            border: `1px solid ${isFullyPaid ? 'rgba(22,163,74,0.2)' : 'rgba(217,119,6,0.2)'}`,
          }}>
            <div>
              <div style={{ fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, color: isFullyPaid ? '#15803d' : '#b45309', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                Outstanding Balance
              </div>
              <div style={{ fontFamily: 'system-ui', fontSize: 11, color: isFullyPaid ? '#15803d' : '#b45309' }}>
                {isFullyPaid ? 'Fully paid — no balance remaining' : `GHS ${paid.toFixed(2)} of GHS ${amount.toFixed(2)} paid`}
              </div>
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: isFullyPaid ? '#15803d' : '#b45309' }}>
              GHS {balance.toFixed(2)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: loading ? 'var(--surface-2)' : 'var(--navy)', color: loading ? 'var(--text-muted)' : '#faf7f0', border: loading ? '1px solid var(--border)' : 'none', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 2px 10px rgba(15,31,61,0.2)' }}>
              <Save size={15} /> {loading ? 'Saving…' : 'Record Payment'}
            </button>
            <Link href="/billing" style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 20px', background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontFamily: 'system-ui', fontSize: 13, textDecoration: 'none' }}>Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}