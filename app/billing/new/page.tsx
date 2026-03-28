'use client'
// src/app/billing/new/page.tsx
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

interface PaymentForm {
  studentId: string
  term: string
  year: string
  feeType: string
  amount: string
  paid: string
}

export default function NewPaymentPage() {
  const router = useRouter()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PaymentForm>({
    defaultValues: { term: 'Term 1', year: '2024', feeType: 'Tuition', amount: '1500', paid: '0' }
  })
  const [classes, setClasses] = useState<{id: number; name: string}[]>([])
  const [students, setStudents] = useState<{id: number; name: string; studentId: string}[]>([])
  const [classId, setClassId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const amount = parseFloat(watch('amount') || '0')
  const paid   = parseFloat(watch('paid') || '0')
  const balance = isNaN(amount - paid) ? 0 : amount - paid

  useEffect(() => { fetch('/api/classes').then(r => r.json()).then(setClasses) }, [])
  useEffect(() => {
    if (!classId) return
    fetch(`/api/students?classId=${classId}`).then(r => r.json()).then(setStudents)
  }, [classId])

  async function onSubmit(data: PaymentForm) {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      router.push('/billing')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/billing" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">Record Payment</h1>
            <p className="text-sm text-slate-500">Log a student fee payment</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Filter by Class</label>
              <select className="input" value={classId} onChange={e => setClassId(e.target.value)}>
                <option value="">All classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Student *</label>
              <select {...register('studentId', { required: true })} className="input">
                <option value="">Select student</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.studentId})</option>)}
              </select>
            </div>

            <div>
              <label className="label">Fee Type *</label>
              <select {...register('feeType', { required: true })} className="input">
                <option value="Tuition">Tuition</option>
                <option value="PTA">PTA Levy</option>
                <option value="Uniform">Uniform</option>
                <option value="Books">Books & Supplies</option>
                <option value="Exam">Exam Fees</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Term *</label>
              <select {...register('term', { required: true })} className="input">
                <option>Term 1</option>
                <option>Term 2</option>
                <option>Term 3</option>
              </select>
            </div>

            <div>
              <label className="label">Total Amount (GHS) *</label>
              <input type="number" step="0.01" {...register('amount', { required: true })} className="input" />
            </div>
            <div>
              <label className="label">Amount Paid (GHS) *</label>
              <input type="number" step="0.01" {...register('paid', { required: true })} className="input" />
            </div>
          </div>

          {/* Balance Preview */}
          <div className={`rounded-xl p-4 flex items-center justify-between
            ${balance <= 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <span className={`text-sm font-semibold ${balance <= 0 ? 'text-green-700' : 'text-amber-700'}`}>
              Outstanding Balance:
            </span>
            <span className={`text-xl font-display font-bold ${balance <= 0 ? 'text-green-700' : 'text-amber-700'}`}>
              GHS {Math.max(0, balance).toFixed(2)}
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Record Payment'}
            </button>
            <Link href="/billing" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
